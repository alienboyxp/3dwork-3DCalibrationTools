/* =====================================================================
   Clicker Factory 2 — REJILLA / MultiClick (modo corte por cuadrícula)
   Cada celda → clicker INDEPENDIENTE completo (placa, well, body, switch).
   Flujo:
     1. Activar → vista 2D + overlay rejilla numerada + REBUILD INMEDIATO
     2. Filas × Columnas + **Auto-escala** (llena celdas) + slider manual
     3. Cada celda: recorta, recentra en (0,0), construye clicker COMPLETO
     4. Posiciona clickers en rejilla con márgenes
   ===================================================================== */
(function () {
  'use strict';

  var KEY = 'ck2_grid_cfg';
  var cfg = {
    enabled: false,
    rows: 2,
    cols: 2,
    marginMm: 2.0,
    shape: 'square',
    pitch: 24,
    designScale: 100,
    autoScale: true
  };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') cfg = Object.assign(cfg, saved);
  } catch (e) { }
  function saveCfg() { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} }

  var zone = { active: false, expected: 0, received: 0, zones: [], parts: [], warnings: [] };
  var geomWorker = null;
  var origPost = null;
  var lastBuildMsg = null;
  var lastRequestId = null;
  var rebuildTimer = null;
  var isRebuilding = false;
  var buildCount = 0;

  var gridOverlay = null;
  var designCanvas = null;

  function log() { console.log('[ck2-grid]', ...arguments); }
  function setStatus(txt) {
    var el = document.getElementById('ck2-status');
    if (el) el.textContent = txt;
    log('STATUS:', txt);
  }

  function debounceRebuild() {
    if (rebuildTimer) clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(function () {
      if (cfg.enabled && lastBuildMsg && !isRebuilding) {
        log('Auto-rebuild por cambio de config');
        triggerRebuild();
      }
    }, 300);
  }

  function setStatus(txt) {
    var el = document.getElementById('ck2-status');
    if (el) el.textContent = txt;
    log('STATUS:', txt);
  }

  // ========== AUTO-SCALA ==========
  function computeAutoScale(regions, rows, cols, pitch, margin) {
    var bbox = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    for (var i = 0; i < regions.length; i++) {
      for (var a = 0; a < regions[i].rings.length; a++) {
        var ring = regions[i].rings[a];
        for (var p = 0; p < ring.length; p++) {
          bbox.minX = Math.min(bbox.minX, ring[p][0]);
          bbox.maxX = Math.max(bbox.maxX, ring[p][0]);
          bbox.minY = Math.min(bbox.minY, ring[p][1]);
          bbox.maxY = Math.max(bbox.maxY, ring[p][1]);
        }
      }
    }
    if (!isFinite(bbox.minX)) return 100;
    var designW = bbox.maxX - bbox.minX;
    var designH = bbox.maxY - bbox.minY;
    if (designW <= 0 || designH <= 0) return 100;
    var cellPitch = pitch - margin;
    var keySize = Math.max(17, cellPitch);
    var targetScale = 0.8 / Math.max(designW, designH);
    var pct = Math.round(targetScale * 100);
    return Math.max(50, Math.min(200, pct));
  }

  function setStatus(txt) {
    var el = document.getElementById('ck2-status');
    if (el) el.textContent = txt;
    log('STATUS:', txt);
  }

  function debounceRebuild() {
    if (rebuildTimer) clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(function () {
      if (cfg.enabled && lastBuildMsg && !isRebuilding) {
        log('Auto-rebuild por cambio de config');
        triggerRebuild();
      }
    }, 300);
  }

  // ========== HOOK WORKER ==========
  var OrigWorker = window.Worker;
  function HookedWorker(url, opts) {
    var w = new OrigWorker(url, opts);
    if (!geomWorker) { try { hookWorker(w); } catch (e) { console.error('[ck2] hook worker', e); } }
    return w;
  }
  HookedWorker.prototype = OrigWorker.prototype;
  window.Worker = HookedWorker;

  function hookWorker(w) {
    geomWorker = w;
    origPost = w.postMessage.bind(w);

    w.postMessage = function (msg) {
      var t = msg && msg.type;
      if (t === 'buildClicker') {
        lastBuildMsg = msg;
        lastRequestId = msg.requestId ?? null;
        buildCount++;
        log('INTERCEPT #' + buildCount + ' buildClicker', 'reqId:', msg.requestId, 'regions:', (msg.regions || []).length, 'enabled:', cfg.enabled);
        if (cfg.enabled && Array.isArray(msg.regions) && msg.regions.length) {
          try { startGrid(msg); return; } catch (e) {
            console.error('[ck2] rejilla falló, build normal', e);
            setStatus('Error: ' + e.message + ' — build normal');
          }
        }
      }
      origPost(msg);
    };

    var origAEL = w.addEventListener.bind(w);
    w.addEventListener = function (type, fn, opts) {
      if (type !== 'message') return origAEL(type, fn, opts);
      var wrapped = function (ev) { handleWorkerMessage(ev, fn); };
      return origAEL(type, wrapped, opts);
    };

    var proto = Object.getPrototypeOf(w);
    var omDesc = Object.getOwnPropertyDescriptor(proto, 'onmessage');
    if (omDesc && omDesc.configurable) {
      Object.defineProperty(w, 'onmessage', {
        configurable: true,
        enumerable: omDesc.enumerable,
        get: function () { return this._ck2_onmessage || null; },
        set: function (fn) {
          this._ck2_onmessage = fn;
          var wrapped = function (ev) { handleWorkerMessage(ev, fn); };
          if (omDesc.set) omDesc.set.call(this, wrapped);
          else this._ck2_onmessage = wrapped;
        }
      });
    }

    function handleWorkerMessage(ev, originalFn) {
      var d = ev && ev.data;
      if (zone.active && d) {
        if (d.type === 'parts') {
          log('RECV parts #' + zone.received, 'parts:', (d.parts || []).length, 'warnings:', (d.warnings || []).length);
          zone.parts.push(d.parts || []);
          zone.warnings = zone.warnings.concat(d.warnings || []);
          zone.received++;
          if (zone.received >= zone.expected) {
            var merged = mergeZoneParts(zone);
            zone.active = false;
            isRebuilding = false;
            log('MERGED total parts:', merged.parts.length, 'warnings:', merged.warnings.length);
            setStatus(merged.warnings.length
              ? ('Listo: ' + merged.parts.length + ' piezas · ' + merged.warnings[0])
              : ('Listo: ' + merged.parts.length + ' clickers en rejilla ' + cfg.rows + '×' + cfg.cols));
            var reply = { data: { type: 'parts', parts: merged.parts, switchPlacements: [], warnings: merged.warnings } };
            if (lastRequestId !== null) reply.data.requestId = lastRequestId;
            originalFn.call(w, reply);
          }
          return;
        }
        if (d.type === 'error') { zone.active = false; isRebuilding = false; log('WORKER ERROR:', d.message); originalFn.call(w, ev); return; }
      }
      originalFn.call(w, ev);
    }
  }

  // ========== GEOMETRY HELPERS ==========
  function regionCentroid(r) {
    var ring = (r && r.rings && r.rings[0]) || [];
    if (!ring.length) return { x: 0, y: 0 };
    var cx = 0, cy = 0;
    for (var p = 0; p < ring.length; p++) { cx += ring[p][0]; cy += ring[p][1]; }
    return { x: cx / ring.length, y: cy / ring.length };
  }

  function regionBBox(regions) {
    var minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    if (!regions || !regions.length) return { minX: -0.5, maxX: 0.5, minY: -0.5, maxY: 0.5 };
    for (var i = 0; i < regions.length; i++) {
      var r = regions[i];
      if (!r || !r.rings) continue;
      for (var a = 0; a < r.rings.length; a++) {
        var ring = r.rings[a];
        if (!ring) continue;
        for (var p = 0; p < ring.length; p++) {
          if (!ring[p]) continue;
          minx = Math.min(minx, ring[p][0]); maxx = Math.max(maxx, ring[p][0]);
          miny = Math.min(miny, ring[p][1]); maxy = Math.max(maxy, ring[p][1]);
        }
      }
    }
    if (!isFinite(minx)) return { minX: -0.5, maxX: 0.5, minY: -0.5, maxY: 0.5 };
    return { minX: minx, maxX: maxx, minY: miny, maxY: maxy };
  }

  function translateRings(rings, dx, dy) {
    if (!rings || !rings.length) return [];
    return rings.map(function (ring) {
      if (!ring || !ring.length) return [];
      return ring.map(function (pt) { return [pt[0] + dx, pt[1] + dy]; });
    });
  }

  function translateRegions(regions, dx, dy) {
    if (!regions || !regions.length) return [];
    return regions.map(function (r) {
      if (!r) return { quantRgb: [0,0,0], components: [], coverage: 0 };
      return {
        quantRgb: r.quantRgb || [0,0,0],
        components: (r.components || []).map(function (c) {
          return { rings: translateRings(c.rings, dx, dy), coverage: c.coverage || 0 };
        }),
        coverage: r.coverage || 0
      };
    });
  }

  function scaleRegions(regions, factor) {
    if (!regions || !regions.length) return [];
    if (!factor || factor === 1) return regions;
    return regions.map(function (r) {
      if (!r) return { quantRgb: [0,0,0], components: [], coverage: 0 };
      return {
        quantRgb: r.quantRgb || [0,0,0],
        components: (r.components || []).map(function (c) {
          return { rings: (c.rings || []).map(function (ring) { return (ring || []).map(function (pt) { return [pt[0] * factor, pt[1] * factor]; }); }), coverage: c.coverage || 0 };
        }),
        coverage: r.coverage || 0
      };
    });
  }

  // ========== PARTICIONADO: RECENTRA CADA CELDA EN (0,0) ==========
  function startGrid(msg) {
    if (isRebuilding) { log('startGrid: ya reconstruyendo, ignorando'); return; }
    isRebuilding = true;

    var rows = Math.max(1, Math.min(6, cfg.rows | 0));
    var cols = Math.max(1, Math.min(6, cfg.cols | 0));
    var pitch = Math.max(18, Math.min(40, cfg.pitch));
    var margin = Math.max(0.5, Math.min(5, cfg.marginMm));
    var keySize = Math.max(17, pitch - margin);

    var scaleFactor = cfg.designScale / 100;
    if (cfg.autoScale) {
      var autoPct = computeAutoScale(msg.regions, rows, cols, pitch, margin);
      if (autoPct !== cfg.designScale) {
        cfg.designScale = autoPct;
        scaleFactor = autoPct / 100;
        var scaleEl = document.getElementById('ck2-scale');
        var scaleVal = document.getElementById('ck2-scalev');
        var autoEl = document.getElementById('ck2-autoscale');
        if (scaleEl) scaleEl.value = autoPct;
        if (scaleVal) scaleVal.textContent = autoPct;
        if (autoEl) autoEl.checked = true;
        log('Auto-escala aplicada:', autoPct + '%');
      }
    }

    // 1) Escalar diseño global ANTES de partir
    var scaledRegions = scaleRegions(msg.regions, scaleFactor);
    var scaledOutline = (msg.outline || []).map(function (ring) {
      return (ring || []).map(function (pt) { return [pt[0] * scaleFactor, pt[1] * scaleFactor]; });
    });

    // 2) Agrupar por celda
    var cells = {};
    for (var i = 0; i < scaledRegions.length; i++) {
      var r = scaledRegions[i];
      if (!r) continue;
      var c = regionCentroid(r);
      var col = Math.max(0, Math.min(cols - 1, Math.floor((c.x + 0.5) * cols)));
      var row = Math.max(0, Math.min(rows - 1, Math.floor((0.5 - c.y) * rows)));
      var k = row + ',' + col;
      if (!cells[k]) cells[k] = { regions: [], cents: [] };
      cells[k].regions.push(r);
      cells[k].cents.push(c);
    }

    var keys = Object.keys(cells);
    if (!keys.length) { isRebuilding = false; throw new Error('no hay regiones que repartir'); }

    log('Particionando en', keys.length, 'celdas de', rows, 'x', cols);

    var msgs = [];
    var pos = [];
    var warnings = [];

    for (var ki = 0; ki < keys.length; ki++) {
      var cell = cells[keys[ki]];
      if (!cell || !cell.regions || !cell.regions.length) continue;

      var parts = keys[ki].split(',');
      var row = parseInt(parts[0], 10);
      var col = parseInt(parts[1], 10);

      var ncx = (col + 0.5) / cols - 0.5;
      var ncy = 0.5 - (row + 0.5) / rows;

      var bbox = regionBBox(cell.regions);
      var cx = (bbox.minX + bbox.maxX) / 2;
      var cy = (bbox.minY + bbox.maxY) / 2;

      var cellRegions = translateRegions(cell.regions, -cx, -cy);
      var cellOutline = translateRings(
        (scaledOutline || []).filter(function (ring) {
          if (!ring || !ring.length) return false;
          var rcx = 0, rcy = 0, n = 0;
          for (var p = 0; p < ring.length; p++) { rcx += ring[p][0]; rcy += ring[p][1]; n++; }
          if (!n) return false;
          rcx /= n; rcy /= n;
          var ccol = Math.max(0, Math.min(cols - 1, Math.floor((rcx + 0.5) * cols)));
          var crow = Math.max(0, Math.min(rows - 1, Math.floor((0.5 - rcy) * rows)));
          return crow === row && ccol === col;
        }),
        -cx, -cy
      );

      if (!cellOutline || !cellOutline.length) {
        var w = bbox.maxX - bbox.minX || 1;
        var h = bbox.maxY - bbox.minY || 1;
        cellOutline = [[ [-w/2, -h/2], [w/2, -h/2], [w/2, h/2], [-w/2, h/2] ]];
      }

      var p = JSON.parse(JSON.stringify(msg.params || {}));
      p.baseShape = cfg.shape === 'outline' ? (msg.params && msg.params.baseShape) : cfg.shape;
      if (cfg.shape !== 'outline') p.baseShape = cfg.shape;
      p.capWidthMm = keySize;
      p.borderWidth = 1.2;
      p.hollowBase = false;
      p.switches = [{ x: 0, y: 0, rotation: 0 }];
      p.componentHeights = {};
      if (p.keychain) p.keychain = Object.assign({}, p.keychain, { enabled: false });

      var bw = bbox.maxX - bbox.minX;
      var bh = bbox.maxY - bbox.minY;
      if (bw < 0.10 || bh < 0.10) {
        warnings.push('Celda (' + (row+1) + ',' + (col+1) + ') demasiado pequeña — sube "Escala diseño %" o reduce la rejilla.');
      }

      msgs.push({ type: 'buildClicker', regions: cellRegions, outline: cellOutline, params: p });

      var cellPitch = keySize + margin;
      pos.push({
        x: (col - (cols - 1) / 2) * cellPitch,
        y: ((rows - 1) / 2 - row) * cellPitch
      });
    }

    zone = { active: true, expected: msgs.length, received: 0, zones: pos, parts: [], warnings: warnings };
    setStatus('Construyendo rejilla ' + rows + '×' + cols + ' (' + msgs.length + ' clickers)…');
    log('Enviando', msgs.length, 'sub-builds al worker');
    for (var m = 0; m < msgs.length; m++) origPost(msgs[m]);
  }

  function mergeZoneParts(z) {
    var out = [];
    if (!z.parts || !z.parts.length) return { parts: [], warnings: z.warnings || [] };
    for (var zi = 0; zi < z.parts.length; zi++) {
      var dx = (z.zones && z.zones[zi] && z.zones[zi].x) || 0;
      var dy = (z.zones && z.zones[zi] && z.zones[zi].y) || 0;
      var parts = z.parts[zi] || [];
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (!part || !part.vertProperties) continue;
        var stride = part.numProp || 3;
        var vp = part.vertProperties;
        for (var j = 0; j < vp.length; j += stride) { vp[j] += dx; vp[j + 1] += dy; }
        out.push(part);
      }
    }
    return { parts: out, warnings: z.warnings || [] };
  }

  // ========== OVERLAY VISUAL REJILLA ==========
  function drawGridOverlay() {
    if (!designCanvas || !gridOverlay) return;
    var ctx = gridOverlay.getContext('2d');
    var w = designCanvas.width;
    var h = designCanvas.height;
    ctx.clearRect(0, 0, w, h);
    if (!cfg.enabled) return;

    var rows = Math.max(1, Math.min(6, cfg.rows | 0));
    var cols = Math.max(1, Math.min(6, cfg.cols | 0));

    ctx.strokeStyle = 'rgba(158, 119, 237, 0.9)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);

    for (var c = 1; c < cols; c++) {
      var x = (c / cols) * w;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (var r = 1; r < rows; r++) {
      var y = (r / rows) * h;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    ctx.fillStyle = 'rgba(158, 119, 237, 0.95)';
    ctx.font = 'bold 14px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var cx = (c + 0.5) / cols * w;
        var cy = (r + 0.5) / rows * h;
        ctx.fillText((r+1) + ',' + (c+1), cx, cy);
      }
    }
  }

  function findDesignCanvas() {
    var canvases = document.querySelectorAll('canvas');
    for (var i = 0; i < canvases.length; i++) {
      var c = canvases[i];
      if (c.width > 200 && c.height > 150 && c.offsetParent) return c;
    }
    return null;
  }

  function ensureGridOverlay() {
    designCanvas = findDesignCanvas();
    if (!designCanvas) { log('Canvas de diseño no encontrado'); return false; }
    if (!gridOverlay) {
      gridOverlay = document.createElement('canvas');
      gridOverlay.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:10;';
      var parent = designCanvas.parentElement;
      if (parent) {
        var style = getComputedStyle(parent);
        if (style.position === 'static') parent.style.position = 'relative';
        parent.appendChild(gridOverlay);
      }
    }
    gridOverlay.width = designCanvas.width;
    gridOverlay.height = designCanvas.height;
    drawGridOverlay();
    log('Overlay rejilla creado', gridOverlay.width, 'x', gridOverlay.height);
    return true;
  }

  function removeGridOverlay() {
    if (gridOverlay && gridOverlay.parentElement) {
      gridOverlay.parentElement.removeChild(gridOverlay);
      gridOverlay = null;
    }
    designCanvas = null;
  }

  // ========== FORZAR VISTA 2D ==========
  function force2DView() {
    log('Forzando vista 2D...');
    var radios = document.querySelectorAll('input[type="radio"][value="2d"]');
    for (var i = 0; i < radios.length; i++) {
      var el = radios[i];
      if (!el.checked && !el.disabled) {
        log('Click radio 2D', el);
        el.click();
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    var buttons = document.querySelectorAll('button, .vl-tab, .vl-btn, [role="radio"]');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var txt = (btn.textContent || btn.ariaLabel || btn.value || '').toLowerCase();
      if ((txt === '2d' || txt === '2d view') && btn.click && !btn.disabled) {
        log('Click botón 2D por texto', btn);
        btn.click();
        return true;
      }
    }
    log('No se encontró control de vista 2D');
    return false;
  }

  function triggerRebuild() {
    if (!lastBuildMsg) { setStatus('Primero carga un diseño en la app.'); isRebuilding = false; return false; }
    if (!cfg.enabled) { setStatus('Activa la rejilla primero.'); isRebuilding = false; return false; }
    if (isRebuilding) return false;
    log('Trigger rebuild MANUAL');
    try { startGrid(lastBuildMsg); return true; } catch (e) { setStatus('Error: ' + e.message); isRebuilding = false; return false; }
  }

  // ========== UI ==========
  function injectUI() {
    if (document.getElementById('ck2-section')) return;
    var rail = document.querySelector('.vl-tool-rail');
    var railPanels = document.querySelector('.vl-settings-rail__panels');
    if (!rail || !railPanels) { setTimeout(injectUI, 300); return; }

    var btn = document.createElement('button');
    btn.className = 'vl-tool-rail__btn';
    btn.type = 'button';
    btn.title = 'Rejilla / MultiClick';
    btn.setAttribute('data-tool', 'grid');
    btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg><span class="vl-tool-rail__label">Rejilla</span>';
    btn.addEventListener('click', function () {
      var sections = document.querySelectorAll('.vl-settings-rail__panel');
      for (var i = 0; i < sections.length; i++) sections[i].hidden = true;
      rail.querySelectorAll('.vl-tool-rail__btn').forEach(function (b) { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); });
      sec.hidden = false;
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');

      if (cfg.enabled) {
        force2DView();
        setTimeout(function () { ensureGridOverlay(); drawGridOverlay(); }, 150);
        setTimeout(function () { if (cfg.enabled && lastBuildMsg) triggerRebuild(); }, 300);
      }
    });
    rail.appendChild(btn);

    var credit = railPanels.querySelector('.vl-panel-credit');
    var sec = document.createElement('div');
    sec.className = 'vl-section vl-settings-rail__panel';
    sec.id = 'ck2-section';
    sec.hidden = true;
    sec.innerHTML =
      '<p class="vl-label">MultiClick</p><hr style="margin:4px 0;border:none;border-top:1px solid var(--line, #2f3440);">' +
      '<p class="vl-label">Rejilla</p>' +
      '<div class="vl-section__body">' +
        '<div class="vl-control">' +
          '<span class="vl-control-label"><span>Activar rejilla</span></span>' +
          '<label class="vl-toggle"><input id="ck2-on" type="checkbox"' + (cfg.enabled ? ' checked' : '') + '><span class="vl-knob"></span></label>' +
        '</div>' +
        '<div id="ck2-opts" style="' + (cfg.enabled ? '' : 'display:none') + '">' +
          '<div class="vl-control">' +
            '<span class="vl-control-label"><span>Filas</span></span>' +
            '<input id="ck2-rows" type="number" min="1" max="6" value="' + cfg.rows + '" style="width:70px;background:#252932;border:1px solid #2f3440;border-radius:6px;color:#e6e9ef;padding:3px 6px">' +
          '</div>' +
          '<div class="vl-control">' +
            '<span class="vl-control-label"><span>Columnas</span></span>' +
            '<input id="ck2-cols" type="number" min="1" max="6" value="' + cfg.cols + '" style="width:70px;background:#252932;border:1px solid #2f3440;border-radius:6px;color:#e6e9ef;padding:3px 6px">' +
          '</div>' +
          '<div class="vl-control">' +
            '<span class="vl-control-label"><span>Margen (mm)</span></span>' +
            '<input id="ck2-margin" type="number" min="0.5" max="5" step="0.5" value="' + cfg.marginMm + '" style="width:70px;background:#252932;border:1px solid #2f3440;border-radius:6px;color:#e6e9ef;padding:3px 6px">' +
          '</div>' +
          '<div class="vl-control">' +
            '<span class="vl-control-label"><span>Forma tecla</span></span>' +
            '<select id="ck2-shape" style="width:130px;background:#252932;border:1px solid #2f3440;border-radius:6px;color:#e6e9ef;padding:3px 6px">' +
              '<option value="square"' + (cfg.shape === 'square' ? ' selected' : '') + '>Cuadrada</option>' +
              '<option value="circle"' + (cfg.shape === 'circle' ? ' selected' : '') + '>Redonda</option>' +
              '<option value="outline"' + (cfg.shape === 'outline' ? ' selected' : '') + '>Silueta</option>' +
            '</select>' +
          '</div>' +
          '<div class="vl-control">' +
            '<span class="vl-control-label"><span>Pitch (mm)</span><span id="ck2-pitchv">' + cfg.pitch + '</span></span>' +
            '<input id="ck2-pitch" type="range" min="18" max="40" step="1" value="' + cfg.pitch + '" style="flex:1;accent-color:var(--accent)">' +
          '</div>' +
          '<div class="vl-control">' +
            '<span class="vl-control-label"><span>Auto-escala</span></span>' +
            '<label class="vl-toggle"><input id="ck2-autoscale" type="checkbox"' + (cfg.autoScale ? ' checked' : '') + '><span class="vl-knob"></span></label>' +
          '</div>' +
          '<div class="vl-control">' +
            '<span class="vl-control-label"><span>Escala diseño %</span><span id="ck2-scalev">' + cfg.designScale + '</span>%</span>' +
            '<input id="ck2-scale" type="range" min="50" max="200" step="5" value="' + cfg.designScale + '" style="flex:1;accent-color:var(--accent)">' +
          '</div>' +
          '<button id="ck2-update" type="button" style="margin-top:10px;padding:10px 12px;border-radius:6px;border:1px solid var(--accent, #9E77ED);background:var(--accent, #9E77ED);color:var(--accent-text, #fff);cursor:pointer;width:100%;font-weight:600">Actualizar / Reconstruir rejilla</button>' +
          '<button id="ck2-view2d" type="button" style="margin-top:6px;padding:8px 12px;border-radius:6px;border:1px solid var(--line, #2f3440);background:var(--panel-2, #252932);color:var(--text, #e6e9ef);cursor:pointer;width:100%">Forzar vista 2D</button>' +
          '<p class="vl-hint" style="font-size:10px;margin-top:8px">Auto-escala ON = calcula % para llenar celdas. Cambia cualquier parámetro → rebuild automático. Botón "Forzar vista 2D" si no cambia solo.</p>' +
        '</div>' +
        '<div id="ck2-status" style="margin-top:8px;font-size:11px;color:#727d8f;min-height:14px">' + (cfg.enabled ? 'Activo — rebuild automático' : 'Desactivado') + '</div>' +
      '</div>';
    if (credit) railPanels.insertBefore(sec, credit);
    else railPanels.appendChild(sec);

    function bind(id, ev, fn) {
      var n = document.getElementById(id);
      if (n) n.addEventListener(ev, fn);
    }
    bind('ck2-on', 'change', function (e) {
      cfg.enabled = e.target.checked;
      saveCfg();
      var opts = document.getElementById('ck2-opts');
      if (opts) opts.style.display = cfg.enabled ? '' : 'none';
      setStatus(cfg.enabled ? 'Activo — rebuild automático' : 'Desactivado');
      if (!cfg.enabled) { removeGridOverlay(); isRebuilding = false; }
      else { 
        force2DView(); 
        setTimeout(function(){ ensureGridOverlay(); drawGridOverlay(); }, 150);
        setTimeout(function () { if (cfg.enabled && lastBuildMsg) triggerRebuild(); }, 300);
      }
    });
    bind('ck2-rows', 'change', function (e) { cfg.rows = Math.max(1, Math.min(6, +e.target.value || 1)); e.target.value = cfg.rows; saveCfg(); debounceRebuild(); if(cfg.enabled){ ensureGridOverlay(); drawGridOverlay(); } });
    bind('ck2-cols', 'change', function (e) { cfg.cols = Math.max(1, Math.min(6, +e.target.value || 1)); e.target.value = cfg.cols; saveCfg(); debounceRebuild(); if(cfg.enabled){ ensureGridOverlay(); drawGridOverlay(); } });
    bind('ck2-margin', 'change', function (e) { cfg.marginMm = Math.max(0.5, Math.min(5, +e.target.value || 0.5)); e.target.value = cfg.marginMm; saveCfg(); debounceRebuild(); });
    bind('ck2-shape', 'change', function (e) { cfg.shape = e.target.value; saveCfg(); debounceRebuild(); });
    bind('ck2-pitch', 'input', function (e) { cfg.pitch = +e.target.value; var v = document.getElementById('ck2-pitchv'); if (v) v.textContent = cfg.pitch; saveCfg(); debounceRebuild(); });
    bind('ck2-autoscale', 'change', function (e) { cfg.autoScale = e.target.checked; saveCfg(); debounceRebuild(); });
    bind('ck2-scale', 'input', function (e) { 
      cfg.designScale = +e.target.value; 
      var v = document.getElementById('ck2-scalev'); 
      if (v) v.textContent = cfg.designScale; 
      cfg.autoScale = false; 
      var autoEl = document.getElementById('ck2-autoscale');
      if (autoEl) autoEl.checked = false;
      saveCfg(); 
      debounceRebuild(); 
    });
    bind('ck2-update', 'click', triggerRebuild);
    bind('ck2-view2d', 'click', function () { log('Botón Forzar vista 2D'); force2DView(); });

    rail.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('.vl-tool-rail__btn') : null;
      if (!b || b === btn) return;
      sec.hidden = true;
      btn.classList.remove('is-active');
      btn.setAttribute('aria-pressed', 'false');
    });

    window.addEventListener('resize', function () { if (cfg.enabled) { ensureGridOverlay(); drawGridOverlay(); } });
  }

  function waitForUI() {
    if (document.querySelector('.vl-settings-rail__panels')) injectUI();
    else setTimeout(waitForUI, 300);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', waitForUI);
  else waitForUI();
})();