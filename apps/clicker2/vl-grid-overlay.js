/* =====================================================================
   Vostok Clicker Generator — GRID / MULTICLICK OVERLAY
   Adds a "Grid" tool to split a design into N×M independent clickers.
   Works with the live Vostok Clicker Generator (index-DiKeyH7v.js).
   ===================================================================== */
(function () {
  'use strict';

  var KEY = 'vl_grid_cfg';
  var cfg = {
    enabled: false,
    rows: 2,
    cols: 2,
    marginMm: 2.0,
    autoScale: true,
    designScale: 100
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

  function log() { console.log('[vl-grid]', ...arguments); }
  function setStatus(txt) {
    var el = document.getElementById('vl-grid-status');
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
  var rebuildTimer = null;
  var isRebuilding = false;

  // ========== HOOK WORKER ==========
  var OrigWorker = window.Worker;
  function HookedWorker(url, opts) {
    var w = new OrigWorker(url, opts);
    if (!geomWorker) { try { hookWorker(w); } catch (e) { console.error('[vl-grid] hook worker', e); } }
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
        log('INTERCEPT #' + (++buildCount) + ' buildClicker', 'reqId:', msg.requestId, 'regions:', (msg.regions || []).length, 'enabled:', cfg.enabled);
        if (cfg.enabled && Array.isArray(msg.regions) && msg.regions.length) {
          try { startGrid(msg); return; } catch (e) {
            console.error('[vl-grid] rejilla falló, build normal', e);
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
        get: function () { return this._vl_onmessage || null; },
        set: function (fn) {
          this._vl_onmessage = fn;
          var wrapped = function (ev) { handleWorkerMessage(ev, fn); };
          if (omDesc.set) omDesc.set.call(this, wrapped);
          else this._vl_onmessage = wrapped;
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

  var buildCount = 0;

  // ========== GEOMETRY HELPERS ==========
  function regionCentroid(r) {
    var ring = (r.rings && r.rings[0]) || [];
    if (!ring.length) return { x: 0, y: 0 };
    var cx = 0, cy = 0;
    for (var p = 0; p < ring.length; p++) { cx += ring[p][0]; cy += ring[p][1]; }
    return { x: cx / ring.length, y: cy / ring.length };
  }

  function regionBBox(regions) {
    var minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
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
      return ring.map(function (pt) { return [pt[0] + dx, pt[1] + dy]; });
    });
  }

  function translateRegions(regions, dx, dy) {
    if (!regions || !regions.length) return [];
    return regions.map(function (r) {
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
      return {
        quantRgb: r.quantRgb,
        components: (r.components || []).map(function (c) {
          return { rings: c.rings.map(function (ring) { return ring.map(function (pt) { return [pt[0] * factor, pt[1] * factor]; }); }), coverage: c.coverage };
        }),
        coverage: r.coverage
      };
    });
  }

  // ========== PARTICIONADO: RECENTRA CADA CELDA EN (0,0) ==========
  function startGrid(msg) {
    if (isRebuilding) { log('startGrid: ya reconstruyendo, ignorando'); return; }
    isRebuilding = true;

    var rows = Math.max(1, Math.min(6, cfg.rows | 0));
    var cols = Math.max(1, Math.min(6, cfg.cols | 0));
    var pitch = Math.max(18, Math.min(40, cfg.capWidthMm || 38));
    var margin = Math.max(0.5, Math.min(5, cfg.marginMm));
    var keySize = Math.max(17, pitch - margin);

    var scaleFactor = cfg.designScale / 100;
    if (cfg.autoScale) {
      var autoPct = computeAutoScale(msg.regions, rows, cols, pitch, margin);
      if (autoPct !== cfg.designScale) {
        cfg.designScale = autoPct;
        scaleFactor = autoPct / 100;
        var scaleEl = document.getElementById('vl-grid-scale');
        var scaleVal = document.getElementById('vl-grid-scalev');
        var autoEl = document.getElementById('vl-grid-autoscale');
        if (scaleEl) scaleEl.value = autoPct;
        if (scaleVal) scaleVal.textContent = autoPct;
        var autoEl2 = document.getElementById('vl-grid-autoscale');
        if (autoEl2) autoEl2.checked = true;
        log('Auto-escala aplicada:', autoPct + '%');
      }
    }

    var scaledRegions = (msg.regions || []).map(function (r) {
      var allRings = [];
      for (var ci = 0; ci < (r.components || []).length; ci++) {
        for (var ri = 0; ri < (r.components[ci].rings || []).length; ri++) {
          allRings.push(r.components[ci].rings[ri]);
        }
      }
      return {
        quantRgb: r.quantRgb,
        components: (r.components || []).map(function (c) {
          return {
            rings: (c.rings || []).map(function (ring) { return ring.map(function (pt) { return [pt[0] * scaleFactor, pt[1] * scaleFactor]; }); }),
            coverage: c.coverage
          };
        }),
        coverage: r.coverage,
        rings: allRings.map(function (ring) { return ring.map(function (pt) { return [pt[0] * scaleFactor, pt[1] * scaleFactor]; }); })
      };
    });

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
      var parts = keys[ki].split(',');
      var row = parseInt(parts[0], 10);
      var col = parseInt(parts[1], 10);

      var bbox = regionBBox(cell.regions);
      var cx = (bbox.minX + bbox.maxX) / 2;
      var cy = (bbox.minY + bbox.maxY) / 2;

      var cellRegions = translateRegions(cell.regions, -cx, -cy);
      var cellOutline = translateRings(
        (msg.outline || []).filter(function (ring) {
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

      if (!cellOutline.length) {
        var w = bbox.maxX - bbox.minX || 1;
        var h = bbox.maxY - bbox.minY || 1;
        cellOutline = [[ [-w/2, -h/2], [w/2, -h/2], [w/2, h/2], [-w/2, h/2] ]];
      }

      var p = JSON.parse(JSON.stringify(msg.params || {}));
      p.baseShape = (msg.params && msg.params.baseShape) || 'outline';
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

  function computeAutoScale(regions, rows, cols, pitch, margin) {
    var bbox = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    for (var i = 0; i < regions.length; i++) {
      for (var a = 0; a < (regions[i].rings || []).length; a++) {
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

  // ========== OVERLAY VISUAL REJILLA ==========
  var gridOverlay = null;
  var designCanvas = null;

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
    // El live Vostok usa botones con data-view
    var buttons = document.querySelectorAll('[data-view="2d"], button[data-view="2d"]');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      if (btn.click && !btn.classList.contains('active')) {
        log('Click botón 2D', btn);
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

  // ========== UI INJECTION ==========
  function injectUI() {
    if (document.getElementById('vl-grid-section')) return;

    // Buscar el tool rail del live Vostok
    var rail = document.querySelector('.vl-tool-rail--nav') || document.querySelector('.vl-tool-rail');
    var sidebar = document.querySelector('.hub-body') || document.querySelector('.hub-main') || document.body;

    if (!rail) { setTimeout(injectUI, 300); return; }

    var btn = document.createElement('button');
    btn.className = 'vl-tool-rail__btn';
    btn.type = 'button';
    btn.title = 'Rejilla / MultiClick';
    btn.setAttribute('data-tool', 'grid');
    btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg><span class="vl-tool-rail__label">Rejilla</span>';

    btn.addEventListener('click', function () {
      rail.querySelectorAll('.vl-tool-rail__btn').forEach(function (b) { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); });
      sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
      btn.classList.toggle('is-active');
      btn.setAttribute('aria-pressed', sec.style.display !== 'none');

      if (cfg.enabled) {
        force2DView();
        setTimeout(function () { ensureGridOverlay(); drawGridOverlay(); }, 150);
        setTimeout(function () { if (cfg.enabled && lastBuildMsg) triggerRebuild(); }, 300);
      }
    });
    rail.appendChild(btn);

    // Crear panel flotante (como el live Vostok usa paneles flotantes)
    var sec = document.createElement('div');
    sec.id = 'vl-grid-section';
    sec.style.cssText = 'position:fixed;top:60px;right:20px;z-index:1000;width:280px;background:var(--panel,#1d2027);color:var(--text,#e6e9ef);border:1px solid var(--line,#2f3440);border-radius:12px;padding:12px;font-family:"Chakra Petch",system-ui,sans-serif;font-size:13px;box-shadow:0 12px 28px rgba(0,0,0,.45);display:none;';
    sec.innerHTML =
      '<h4 style="margin:0 0 8px;font-size:13px;letter-spacing:.4px">MultiClick (Grid)</h4>' +
      '<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--line,#2f3440)"></div>' +
      '<label style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0;color:#9aa3b2"><span>Activar rejilla</span><label class="vl-toggle"><input id="vl-grid-on" type="checkbox"' + (cfg.enabled ? ' checked' : '') + '><span class="vl-knob"></span></label></label>' +
      '<div id="vl-grid-opts" style="' + (cfg.enabled ? '' : 'display:none') + '">' +
        '<label style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0;color:#9aa3b2"><span>Filas</span><input id="vl-grid-rows" type="number" min="1" max="6" value="' + cfg.rows + '" style="width:70px;background:#252932;border:1px solid #2f3440;border-radius:6px;color:#e6e9ef;padding:3px 6px"></label>' +
        '<label style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0;color:#9aa3b2"><span>Columnas</span><input id="vl-grid-cols" type="number" min="1" max="6" value="' + cfg.cols + '" style="width:70px;background:#252932;border:1px solid #2f3440;border-radius:6px;color:#e6e9ef;padding:3px 6px"></label>' +
        '<label style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0;color:#9aa3b2"><span>Margen (mm)</span><input id="vl-grid-margin" type="number" min="0.5" max="5" step="0.5" value="' + cfg.marginMm + '" style="width:70px;background:#252932;border:1px solid #2f3440;border-radius:6px;color:#e6e9ef;padding:3px 6px"></label>' +
        '<label style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0;color:#9aa3b2"><span>Auto-escala</span><label class="vl-toggle"><input id="vl-grid-autoscale" type="checkbox"' + (cfg.autoScale ? ' checked' : '') + '><span class="vl-knob"></span></label></label>' +
        '<label style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0;color:#9aa3b2"><span>Escala diseño %</span><span id="vl-grid-scalev">' + cfg.designScale + '</span></label><input id="vl-grid-scale" type="range" min="50" max="200" step="5" value="' + cfg.designScale + '" style="flex:1;accent-color:var(--accent)">' +
        '<button id="vl-grid-update" type="button" style="margin-top:8px;padding:6px 10px;border-radius:6px;border:1px solid var(--line);background:var(--accent,#9E77ED);color:var(--accent-text,#fff);cursor:pointer;width:100%">Actualizar / Reconstruir</button>' +
        '<button id="vl-grid-view2d" type="button" style="margin-top:6px;padding:6px 10px;border-radius:6px;border:1px solid var(--line);background:var(--panel-2);color:var(--text);cursor:pointer;width:100%">Forzar vista 2D</button>' +
        '<p style="font-size:10px;margin-top:8px;color:#727d8f">Auto-escala ON = calcula % para llenar celdas. Cambia cualquier parámetro → rebuild automático.</p>' +
      '</div>' +
      '<div id="vl-grid-status" style="margin-top:8px;font-size:11px;color:#727d8f;min-height:14px">' + (cfg.enabled ? 'Activo — rebuild automático' : 'Desactivado') + '</div>';

    document.body.appendChild(sec);

    function bind(id, ev, fn) {
      var n = document.getElementById(id);
      if (n) n.addEventListener(ev, fn);
    }
    bind('vl-grid-on', 'change', function (e) {
      cfg.enabled = e.target.checked;
      saveCfg();
      var opts = document.getElementById('vl-grid-opts');
      if (opts) opts.style.display = cfg.enabled ? '' : 'none';
      setStatus(cfg.enabled ? 'Activo — rebuild automático' : 'Desactivado');
      if (!cfg.enabled) { removeGridOverlay(); }
      else { force2DView(); setTimeout(function(){ ensureGridOverlay(); drawGridOverlay(); }, 150); }
    });
    bind('vl-grid-rows', 'change', function (e) { cfg.rows = Math.max(1, Math.min(6, +e.target.value || 1)); e.target.value = cfg.rows; saveCfg(); debounceRebuild(); if(cfg.enabled){ ensureGridOverlay(); drawGridOverlay(); } });
    bind('vl-grid-cols', 'change', function (e) { cfg.cols = Math.max(1, Math.min(6, +e.target.value || 1)); e.target.value = cfg.cols; saveCfg(); debounceRebuild(); if(cfg.enabled){ ensureGridOverlay(); drawGridOverlay(); } });
    bind('vl-grid-margin', 'change', function (e) { cfg.marginMm = Math.max(0.5, Math.min(5, +e.target.value || 0.5)); e.target.value = cfg.marginMm; saveCfg(); debounceRebuild(); });
    bind('vl-grid-autoscale', 'change', function (e) { cfg.autoScale = e.target.checked; saveCfg(); debounceRebuild(); });
    bind('vl-grid-scale', 'input', function (e) {
      cfg.designScale = +e.target.value;
      var v = document.getElementById('vl-grid-scalev');
      if (v) v.textContent = cfg.designScale;
      cfg.autoScale = false;
      var autoEl = document.getElementById('vl-grid-autoscale');
      if (autoEl) autoEl.checked = false;
      saveCfg();
      debounceRebuild();
    });
    bind('vl-grid-update', 'click', triggerRebuild);
    bind('vl-grid-view2d', 'click', function () { log('Botón Forzar vista 2D'); force2DView(); });

    // Cerrar panel al clickear fuera
    document.addEventListener('click', function (e) {
      if (!sec.contains(e.target) && !btn.contains(e.target)) {
        sec.style.display = 'none';
        btn.classList.remove('is-active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
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

  function waitForUI() {
    if (document.querySelector('.vl-tool-rail')) {
      injectUI();
    } else {
      setTimeout(waitForUI, 300);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForUI);
  } else {
    waitForUI();
  }
})();