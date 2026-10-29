/* =====================================================================
   Clicker Factory 2 — ZONAS (experimento)
   ---------------------------------------------------------------------
   Añade "zonas" al generador clonado: un diseño (imagen / SVG / icono /
   texto) se divide en una rejilla de N teclas independientes, cada una
   con su propio switch MX y su propia base, colocadas en placa.

   Cómo funciona (sin tocar el bundle minificado):
   - Este script se ejecuta ANTES del bundle y envuelve window.Worker.
   - Intercepta los mensajes 'buildClicker' hacia el worker de geometría.
   - Con zonas activas, en vez de un build se envían N sub-builds
     (uno por zona, con su recorte de regiones y su switch centrado).
   - Las respuestas del worker se acumulan y se entregan a la app como
     un único 'parts' con todas las teclas trasladadas a su posición.
   - Todo el motor (trazado, cuantización, manifold/WASM, switch real)
     se reutiliza tal cual; aquí solo se orquesta.

   Modo 3D model: no soportado en esta v1 (pasa sin tocar).
   ===================================================================== */
(function () {
  'use strict';

  // ── Configuración (persistente) ─────────────────────────────────────
  var KEY = 'ck2_zones_cfg';
  var cfg = { enabled: false, rows: 2, cols: 2, shape: 'square', pitch: 24 };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') cfg = Object.assign(cfg, saved);
  } catch (e) { /* usar defaults */ }

  function saveCfg() { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} }

  // ── Estado del build por zonas ──────────────────────────────────────
  var zone = { active: false, expected: 0, received: 0, zones: [], parts: [], warnings: [] };
  var geomWorker = null;
  var origPost = null;

  function setPanelStatus(txt) {
    var el = document.getElementById('ck2-status');
    if (el) el.textContent = txt;
  }

  // ── Hook del Worker ─────────────────────────────────────────────────
  var OrigWorker = window.Worker;
  function HookedWorker(url, opts) {
    var w = new OrigWorker(url, opts);
    if (!geomWorker) {
      try { hookWorker(w); } catch (e) { console.error('[ck2] hook worker', e); }
    }
    return w;
  }
  HookedWorker.prototype = OrigWorker.prototype;
  window.Worker = HookedWorker;

  function hookWorker(w) {
    geomWorker = w;
    origPost = w.postMessage.bind(w);

    w.postMessage = function (msg) {
      var t = msg && msg.type;
      if (t === 'buildClicker' && cfg.enabled && Array.isArray(msg.regions) && msg.regions.length) {
        try { startZones(msg); return; } catch (e) {
          console.error('[ck2] zonas fallaron, build normal', e);
          setPanelStatus('Error: ' + e.message + ' — build normal');
        }
      }
      origPost(msg);
    };

    // Envolvemos addEventListener: la asignación `worker.onmessage = fn`
    // del bundle acaba llamando a addEventListener('message', ...), así
    // que nuestro wrapper ve todos los mensajes antes que la app.
    var origAEL = w.addEventListener.bind(w);
    w.addEventListener = function (type, fn, opts) {
      if (type !== 'message') return origAEL(type, fn, opts);
      var wrapped = function (ev) {
        var d = ev && ev.data;
        if (zone.active && d) {
          if (d.type === 'parts') {
            zone.parts.push(d.parts);
            zone.warnings = zone.warnings.concat(d.warnings || []);
            zone.received++;
            if (zone.received >= zone.expected) {
              var merged = mergeZoneParts(zone);
              zone.active = false;
              setPanelStatus(merged.warnings.length
                ? ('Listo: ' + merged.parts.length + ' piezas · ' + merged.warnings[0])
                : ('Listo: ' + merged.parts.length + ' piezas en ' + zone.zones.filter(Boolean).length + ' teclas'));
              fn.call(w, { data: { type: 'parts', parts: merged.parts, switchPlacements: [], warnings: merged.warnings } });
            }
            return; // respuestas intermedias no llegan a la app
          }
          if (d.type === 'error') { zone.active = false; fn.call(w, ev); return; }
        }
        fn.call(w, ev);
      };
      return origAEL(type, wrapped, opts);
    };
  }

  // ── Partición del diseño en zonas ───────────────────────────────────
  function startZones(msg) {
    var rows = Math.max(1, Math.min(6, cfg.rows | 0));
    var cols = Math.max(1, Math.min(6, cfg.cols | 0));
    var pitch = Math.max(18, Math.min(40, cfg.pitch));
    var gap = 2.0;
    var keySize = Math.max(17, pitch - gap);

    // Reparto de regiones por centroide (coordenadas normalizadas Y-up)
    var cells = {};
    for (var i = 0; i < msg.regions.length; i++) {
      var r = msg.regions[i];
      var ring = (r.rings && r.rings[0]) || [];
      if (!ring.length) continue;
      var cx = 0, cy = 0;
      for (var p = 0; p < ring.length; p++) { cx += ring[p][0]; cy += ring[p][1]; }
      cx /= ring.length; cy /= ring.length;
      var col = Math.max(0, Math.min(cols - 1, Math.floor((cx + 0.5) * cols)));
      var row = Math.max(0, Math.min(rows - 1, Math.floor((0.5 - cy) * rows)));
      var k = row * cols + col;
      (cells[k] = cells[k] || []).push(r);
    }

    var keys = Object.keys(cells);
    if (!keys.length) throw new Error('no hay regiones que repartir');

    // Una petición por zona no vacía
    var msgs = [];
    var pos = [];
    for (var ki = 0; ki < keys.length; ki++) {
      var kidx = parseInt(keys[ki], 10);
      var row = Math.floor(kidx / cols), col = kidx % cols;
      var cellRegions = cells[kidx].map(function (r) { return JSON.parse(JSON.stringify(r)); });
      var outline = [];
      for (var a = 0; a < cellRegions.length; a++) {
        for (var b = 0; b < cellRegions[a].rings.length; b++) {
          outline.push(JSON.parse(JSON.stringify(cellRegions[a].rings[b])));
        }
      }
      var p = JSON.parse(JSON.stringify(msg.params || {}));
      p.baseShape = cfg.shape;                 // 'square' | 'circle' | 'outline'
      p.capWidthMm = keySize;
      p.borderWidth = 1.2;
      p.hollowBase = false;
      p.switches = [{ x: 0, y: 0, rotation: 0 }];
      p.componentHeights = {};
      if (p.keychain) p.keychain = Object.assign({}, p.keychain, { enabled: false });
      msgs.push({ type: 'buildClicker', regions: cellRegions, outline: outline, params: p });
      pos.push({
        x: (col - (cols - 1) / 2) * pitch,
        y: ((rows - 1) / 2 - row) * pitch
      });
    }

    zone = { active: true, expected: msgs.length, received: 0, zones: pos, parts: [], warnings: [] };
    setPanelStatus('Construyendo ' + msgs.length + ' teclas…');
    for (var m = 0; m < msgs.length; m++) origPost(msgs[m]);
  }

  function mergeZoneParts(z) {
    var out = [];
    for (var zi = 0; zi < z.parts.length; zi++) {
      var dx = z.zones[zi].x, dy = z.zones[zi].y;
      var parts = z.parts[zi] || [];
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        var stride = part.numProp || 3;
        var vp = part.vertProperties;
        for (var j = 0; j < vp.length; j += stride) { vp[j] += dx; vp[j + 1] += dy; }
        out.push(part);
      }
    }
    return { parts: out, warnings: z.warnings };
  }

  // ── Panel de control (UI mínima superpuesta) ────────────────────────
  function buildPanel() {
    if (document.getElementById('ck2-panel')) return;
    var css = document.createElement('style');
    css.textContent =
      '#ck2-panel{position:fixed;left:16px;bottom:16px;z-index:2000;width:236px;background:#1d2027;color:#e6e9ef;' +
      'border:1px solid #2f3440;border-radius:12px;padding:12px;font-family:"Chakra Petch",system-ui,sans-serif;' +
      'box-shadow:0 12px 28px rgba(0,0,0,.45);font-size:13px}' +
      '#ck2-panel h4{margin:0 0 8px;font-size:13px;letter-spacing:.4px}' +
      '#ck2-panel label{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0;color:#9aa3b2}' +
      '#ck2-panel input[type=number],#ck2-panel select{width:96px;background:#252932;border:1px solid #2f3440;' +
      'border-radius:6px;color:#e6e9ef;padding:3px 6px;font-family:inherit}' +
      '#ck2-panel input[type=range]{flex:1;accent-color:#9E77ED}' +
      '#ck2-panel .row{display:flex;align-items:center;gap:8px}' +
      '#ck2-status{margin-top:8px;font-size:11px;color:#727d8f;min-height:14px}' +
      '#ck2-panel .note{margin-top:6px;font-size:10px;line-height:1.4;color:#727d8f}';
    document.head.appendChild(css);

    var el = document.createElement('div');
    el.id = 'ck2-panel';
    el.innerHTML =
      '<h4>ZONAS · beta</h4>' +
      '<label><span>Activar zonas</span><input id="ck2-on" type="checkbox"' + (cfg.enabled ? ' checked' : '') + '></label>' +
      '<label><span>Filas</span><input id="ck2-rows" type="number" min="1" max="6" value="' + cfg.rows + '"></label>' +
      '<label><span>Columnas</span><input id="ck2-cols" type="number" min="1" max="6" value="' + cfg.cols + '"></label>' +
      '<label><span>Forma tecla</span><select id="ck2-shape">' +
        '<option value="square"' + (cfg.shape === 'square' ? ' selected' : '') + '>Cuadrada</option>' +
        '<option value="circle"' + (cfg.shape === 'circle' ? ' selected' : '') + '>Redonda</option>' +
        '<option value="outline"' + (cfg.shape === 'outline' ? ' selected' : '') + '>Silueta</option>' +
      '</select></label>' +
      '<label><span>Pitch (mm)</span><span class="row"><input id="ck2-pitch" type="range" min="18" max="40" step="1" value="' + cfg.pitch + '"><b id="ck2-pitchv">' + cfg.pitch + '</b></span></label>' +
      '<div id="ck2-status">' + (cfg.enabled ? 'Activo — reconstruye desde la app' : 'Desactivado') + '</div>' +
      '<div class="note">Al activar, toca cualquier control de la app (o vuelve a subir la imagen) para reconstruir. Modo 3D model: próxima fase.</div>';
    document.body.appendChild(el);

    var bind = function (id, ev, fn) {
      var n = document.getElementById(id);
      if (n) n.addEventListener(ev, fn);
    };
    bind('ck2-on', 'change', function (e) { cfg.enabled = e.target.checked; saveCfg(); setPanelStatus(cfg.enabled ? 'Activo — reconstruye desde la app' : 'Desactivado'); });
    bind('ck2-rows', 'change', function (e) { cfg.rows = Math.max(1, Math.min(6, +e.target.value || 1)); e.target.value = cfg.rows; saveCfg(); });
    bind('ck2-cols', 'change', function (e) { cfg.cols = Math.max(1, Math.min(6, +e.target.value || 1)); e.target.value = cfg.cols; saveCfg(); });
    bind('ck2-shape', 'change', function (e) { cfg.shape = e.target.value; saveCfg(); });
    bind('ck2-pitch', 'input', function (e) { cfg.pitch = +e.target.value; document.getElementById('ck2-pitchv').textContent = cfg.pitch; saveCfg(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildPanel);
  } else {
    buildPanel();
  }
})();
