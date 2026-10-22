/**
 * logDiagnosis.js — Diagnóstico determinista de un log de Klipper.
 *
 * Aplica el mismo modelo que el 3MF Inspector de 3Dwork:
 *   · veredicto (LISTO / REPARABLE / ALTO RIESGO / NO SE PUEDE DETERMINAR)
 *   · nota 0-10 con rúbrica explícita (cada resta dice qué costó y por qué)
 *   · hallazgos con evidencia + por qué importa + fix concreto + enlace a la guía
 *   · "no determinable" cuando el log no trae lo que haría falta
 *
 * Sin dependencias. Funciona en navegador (window.LogDiagnosis) y en Node.
 */
(function (root) {
  'use strict';

  const GUIDES = {
    klipper: 'https://klipper.3dwork.io/klipper/troubleshooting',
    labs: 'https://labs.3dwork.io/guias-impresion-3d/resolucion-de-problemas',
    extrusor: 'https://labs.3dwork.io/guias-impresion-3d/calibracion_3d',
    tools: 'https://3dwork.io/tools/'
  };

  // Valor de fábrica del avance del extrusor (mm de filamento por vuelta)
  const STOCK_ROTATION = { '1.8': 40, '2.3': 2.85 };
  const MAX_SCORE = 10;
  const HARD_CAP = 4;

  const RULES = [
    {
      id: 'mcu_down', sev: 'risk', cap: HARD_CAP,
      detect: (log) => firstMatch(log, [
        /Unable to open serial port/i,
        /Unable to connect(?: to)? (?:the )?(?:mcu|serial)/i,
        /MCU '.*' shutdown:/i,
        /Transition to shutdown state:/i,
        /Lost communication with MCU/i
      ]),
      title: 'El MCU se desconectó o la impresora se paró',
      why: 'Sin MCU no hay pasos: la impresión se corta a media pieza y la pieza se queda pegada a la cama.',
      fix: 'Revisa el cable USB (que no roce la rueda del extrusor), la alimentación del MCU y que el firmware del MCU sea el mismo que el de Klipper.',
      guide: 'klipper'
    },
    {
      id: 'mcu_protocol', sev: 'warn',
      detect: (log) => firstMatch(log, [
        /MCU Protocol error/i,
        /Protocol error/i,
        /Unable to extract params/i,
        /bytes_per_report/i
      ]),
      title: 'El firmware del MCU no habla el mismo idioma que Klipper',
      why: 'Los parámetros que manda Klipper no coinciden con los que entiende el MCU: la impresión va a fallar o a imprimir con parámetros equivocados.',
      fix: 'Actualiza el firmware del MCU a la misma versión que la de Klipper (el propio log indica el comando).',
      guide: 'klipper'
    },
    {
      id: 'thermal_runaway', sev: 'risk', cap: HARD_CAP,
      detect: (log) => firstMatch(log, [
        /Heater .* not heating/i,
        /Thermal Runaway/i,
        /Failed to reach target temperature/i
      ]),
      title: 'Fuga térmica: la cama o el hotend no llega a temperatura',
      why: 'Sin temperatura no hay capa: el filamento no fluye y además el plástico se degrada (en PETG y ABS enseguida).',
      fix: 'Comprueba el termistor y sus cables, la placa y el aislamiento del hotend, y que la temperatura objetivo sea razonable para el material.',
      guide: 'labs'
    },
    {
      id: 'tmc_error', sev: 'risk',
      detect: (log) => firstMatch(log, [
        /TMC '.*' reports error:/i,
        /TMC .* reports error/i
      ]),
      title: 'El driver del motor falla (TMC)',
      why: 'Suele ser corriente excesiva para el motor, Vref alto o un cable mal conectado: el motor se calienta, pierde pasos y la pieza sale con capas desplazadas.',
      fix: 'Baja la corriente (run_current) y el Vref, revisa el cableado del motor y el disipador del driver.',
      guide: 'labs'
    },
    {
      id: 'adc_range', sev: 'risk',
      detect: (log) => firstMatch(log, [
        /ADC out of range/i,
        /adc.*out of range/i
      ]),
      title: 'El termistor manda lecturas imposibles',
      why: 'Klipper corta la impresión porque no sabe cuánto hay en la cama o en el hotend.',
      fix: 'Revisa el termistor y su cable, y que el tipo de sensor (PT1000, NTC) sea el correcto en la config.',
      guide: 'labs'
    },
    {
      id: 'overheat', sev: 'warn',
      detect: (log) => firstMatch(log, [
        /Exceeded max temperature/i,
        /Overheat/i
      ]),
      title: 'Se pasó de temperatura',
      why: 'El ventilador de la hotend no enfría lo suficiente: se deforma el material y la capa no adhere bien.',
      fix: 'Revisa el ventilador del hotend, la.flow decooling y que la temperatura objetivo no sea excesiva para el material.',
      guide: 'labs'
    },
    {
      id: 'timer', sev: 'info',
      detect: (log) => firstMatch(log, [
        /Timer too close/i,
        /Missed scheduling of next .* event/i
      ]),
      title: 'La placa no llega a tiempo a calcular los pasos',
      why: 'Normal en versiones rápidas o si la Raspberry va justa: provoca tirones y micro-paradas.',
      fix: 'Baja la velocidad máxima y la aceleración, o aligera la SD y el compartilhamiento de red.',
      guide: 'klipper'
    },
    {
      id: 'klippy_mcu_mismatch', sev: 'warn',
      // solo si el MCU llegó a hablar (si no se conectó, el aviso de versión
      // sería un falso positivo: no hay build del MCU con el que comparar)
      detect: (log) => {
        if (!/Last MCU build config/i.test(log)) return null;
        if (/Unable to open serial port|Unable to connect/i.test(log)) return null;
        const klippyBuild = (log.match(/Klipper (?:version )?([\w.\-]+)/i) || [])[1];
        const mcuBuild = (log.match(/Last MCU build config: ([^\n]*)/i) || [])[1];
        if (!klippyBuild || !mcuBuild) return null;
        if (mcuBuild.indexOf(klippyBuild) !== -1) return null;
        return 'Klipper ' + klippyBuild + ' frente a MCU ' + mcuBuild.trim();
      },
      title: 'Klipper y el MCU no son de la misma compilación',
      why: 'Con versiones distintas, Klipper y el MCU pueden no entender los mismos comandos: aparece el «Protocol error» un rato después de arrancar.',
      fix: 'Compila o actualiza Klipper y el firmware del MCU a la misma versión.',
      guide: 'klipper'
    }
  ];

  // ── utilidades ──────────────────────────────────────────────────────────

  function firstMatch(text, patterns) {
    if (!text) return null;
    for (const re of patterns) {
      const m = text.match(re);
      if (m) {
        const line = extractLine(text, m.index || 0);
        return (line || m[0]).trim().slice(0, 200);
      }
    }
    return null;
  }

  function extractLine(text, idx) {
    const start = text.lastIndexOf('\n', idx) + 1;
    let end = text.indexOf('\n', idx);
    if (end === -1) end = text.length;
    return text.slice(start, end);
  }

  /** Config de Klipper por secciones: { 'extruder': {rotation_distance: '40'}, ... }
   *  Klipper usa "clave = valor" (no "clave: valor"). */
  function parseConfig(configText) {
    const out = {};
    if (!configText) return out;
    let section = '';
    for (const rawLine of configText.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      if (line.startsWith('[') && line.endsWith(']')) {
        section = line.slice(1, -1).trim();
        out[section] = out[section] || {};
        continue;
      }
      let idx = line.indexOf('=');
      let key, val;
      if (idx !== -1) {
        key = line.slice(0, idx).trim();
        val = line.slice(idx + 1).trim();
      } else {
        idx = line.indexOf(':');
        if (idx === -1) continue;
        key = line.slice(0, idx).trim();
        val = line.slice(idx + 1).trim();
      }
      if (!out[section]) out[section] = {};
      out[section][key] = val;
    }
    return out;
  }

  function cfgGet(cfg, section, key) {
    const s = cfg[section];
    return s ? s[key] : undefined;
  }

  function firstSectionStarting(cfg, prefix) {
    for (const name of Object.keys(cfg)) {
      if (name === prefix || name.startsWith(prefix + '_') ||
          name.startsWith(prefix + ' ')) return name;
    }
    return null;
  }

  // ── reglas de configuración ─────────────────────────────────────────────

  // Avance del extrusor: hay dos geometrias habituales y NO se puede
  // asumir una sola (1.8 GT2 = 40 mm/vuelta; 2.3 tipo Bambu = ~8,06 mm).
  // Solo avisamos si el valor no se parece a ninguna de las dos.
  const KNOWN_ROTATION = [
    { value: 40, label: 'motor 1.8 (GT2, 200 pasos/vuelta)' },
    { value: 8.0588, label: 'motor 2.3 (Bambu, 400 pasos/vuelta)' },
    { value: 2.85, label: 'motor 2.3 tipo BMG' }
  ];

  function configFindings(cfg) {
    const out = [];

    const ext = firstSectionStarting(cfg, 'extruder');
    let rd = NaN;
    if (ext) rd = parseFloat(cfgGet(cfg, ext, 'rotation_distance'));
    if (!isNaN(rd) && rd > 0) {
      let known = null;
      for (const k of KNOWN_ROTATION) {
        if (Math.abs(rd - k.value) / k.value < 0.03) { known = k; break; }
      }
      if (!known) {
        out.push({
          id: 'rotation_distance', sev: 'info',
          title: 'El avance del extrusor no es un valor de fabrica conocido',
          evidence: 'rotation_distance = ' + rd,
          why: 'Los valores habituales son 40 mm/vuelta (motor 1.8) o 8,06 ' +
            'mm/vuelta (motor 2.3). Otro valor cambia la extrusion real, y con ' +
            'el todos los E-steps que midas.',
          fix: 'Si es intencionado (engranaje o GT2 modificado), recalcula el ' +
            'E-steps con ese valor real. Si no, vuelve al de fabrica.',
          guide: 'extrusor'
        });
      }
    }

    // Microsteps del eje: en la mayoria de maquinas los ejes son motores 1.8
    const st = firstSectionStarting(cfg, 'stepper_x');
    if (st) {
      const ms = parseInt(cfgGet(cfg, st, 'microsteps'), 10);
      if (!isNaN(ms) && ms >= 32) {
        out.push({
          id: 'microsteps', sev: 'warn',
          title: '32 microsteps en el eje X',
          evidence: 'microsteps = ' + ms,
          why: 'Casi todas las maquinas usan motores 1.8 en los ejes, y no ' +
            'son fiables por encima de 16 microsteps: se pierden pasos y la ' +
            'pieza sale con capas desplazadas.',
          fix: 'Vuelve a 16 microsteps en los ejes y compensa la velocidad ' +
            'con el driver (o con el Input Shaper).',
          guide: 'klipper'
        });
      }
    }

    // Corriente excesiva en drivers TMC (según el tipo)
    for (const section of Object.keys(cfg)) {
      const cur = parseFloat(cfgGet(cfg, section, 'run_current'));
      if (isNaN(cur)) continue;
      const limit = section.startsWith('tmc2209') ? 1.2
        : section.startsWith('tmc2208') ? 1.5
          : section.startsWith('tmc2130') ? 1.2 : null;
      if (limit && cur > limit) {
        out.push({
          id: 'run_current', sev: 'warn',
          title: 'Corriente alta para el driver ' + section,
          evidence: 'run_current = ' + cur + ' A (límite cómodo ~' + limit + ' A)',
          why: 'Con más corriente el driver se calienta y acaba dando errores TMC: el motor pierde pasos y la pieza sale con capas desplazadas.',
          fix: 'Baja run_current a ' + limit + ' A y revisa el Vref (herramienta Vref de 3Dwork).',
          guide: 'labs'
        });
      }
    }

    // Input shaper sin frecuencia
    const isp = cfg['input_shaper'];
    if (isp && isp.shaper_type) {
      const freq = parseFloat(isp.frequency);
      if (isp.shaper_type !== 'mzv' && (isNaN(freq) || freq === 0)) {
        out.push({
          id: 'shaper_no_freq', sev: 'warn',
          title: 'Input Shaper configurado sin frecuencia',
          evidence: 'shaper_type = ' + isp.shaper_type + ' sin frequency',
          why: 'Sin frecuencia, Klipper aplica el shaper sin ajuste real: la resonancia sigue notándose en las esquinas.',
          fix: 'Mide la resonancia (herramienta Input Shaper de 3Dwork) y rellena frequency y damping_ratio.',
          guide: 'klipper'
        });
      } else if (!isNaN(freq) && freq > 0 && freq < 5) {
        out.push({
          id: 'shaper_low_freq', sev: 'info',
          title: 'Frecuencia de resonancia muy baja',
          evidence: 'frequency = ' + freq + ' Hz',
          why: 'Por debajo de 5 Hz suele haber un problema mecánico (holgura, rodamiento, eje) más que un ajuste de software.',
          fix: 'Revisa la mecánica antes de tocar la configuración.',
          guide: 'klipper'
        });
      }
    }

    // Hay un perfil de bed mesh guardado
    if (cfg['bed_mesh'] || cfg['mesh']) {
      out.push({
        id: 'bed_mesh_profile', sev: 'info',
        title: 'Hay un perfil de bed mesh en la configuración',
        evidence: 'Sección [bed_mesh] presente en el config',
        why: 'Puedes comprobar la nivelación con los datos guardados en lugar de la marca de calibración.',
        fix: 'Abre la herramienta de malla de 3Dwork y sube el config para ver las alturas por punto.',
        guide: 'tools'
      });
    }

    return out;
  }

  // ── análisis ────────────────────────────────────────────────────────────

  function analyze(input) {
    const log = (input && input.klippy) || '';
    const cfg = parseConfig((input && input.config) || '');
    const findings = [];
    const undetermined = [];

    for (const rule of RULES) {
      let ev = null;
      try { ev = rule.detect(log, cfg); } catch (e) { ev = null; }
      if (!ev) continue;
      findings.push({
        id: rule.id, severity: rule.sev, cap: rule.cap || null,
        title: rule.title, evidence: ev, why: rule.why, fix: rule.fix,
        guide: rule.guide, guideUrl: GUIDES[rule.guide] || null
      });
    }

    for (const f of configFindings(cfg)) {
      findings.push({
        id: f.id, severity: f.sev, cap: null, title: f.title,
        evidence: f.evidence, why: f.why, fix: f.fix,
        guide: f.guide, guideUrl: GUIDES[f.guide] || null
      });
    }

    // Lo que no se puede determinar
    if (!Object.keys(cfg).length) {
      undetermined.push('El log no incluye el config de la impresora: sin él no ' +
        'puedo comprobar el avance del extrusor, el Input Shaper ni la ' +
        'corriente de los drivers.');
    }
    if (!/mcu '.*': .*=/.test(log) && !/Connected MCU|Once MCU is|Configured MCU/i.test(log)) {
      undetermined.push('No veo la conexión con el MCU en el log: no puedo ' +
        'saber si hubo pausas por sobrecalentamiento ni cortes de ' +
        'comunicación.');
    }
    if (!log.trim()) {
      undetermined.push('El log está vacío: no hay nada que analizar.');
    }

    // Puntuación con rúbrica
    const counts = { risk: 0, warn: 0, info: 0 };
    for (const f of findings) counts[f.severity] = (counts[f.severity] || 0) + 1;
    const deductions = [];
    const caps = [];

    if (counts.risk) {
      const pts = -Math.min(6, counts.risk * 1.5);
      deductions.push({
        check: 'riesgo', points: round1(pts),
        rule: '-1,5 por cada fallo grave (máx -6)'
      });
    }
    if (counts.warn) {
      const pts = -Math.min(3, counts.warn * 0.5);
      deductions.push({
        check: 'aviso', points: round1(pts),
        rule: '-0,5 por cada aviso (máx -3)'
      });
    }
    if (counts.info) {
      const pts = -Math.min(1, counts.info * 0.25);
      deductions.push({
        check: 'info', points: round1(pts),
        rule: '-0,25 por cada observación (máx -1)'
      });
    }
    for (const f of findings) {
      if (f.cap) {
        caps.push({ check: f.id, rule: f.title, limit: f.cap, applied: true });
      }
    }

    let score = MAX_SCORE + deductions.reduce((a, d) => a + d.points, 0);
    for (const c of caps) if (c.applied) score = Math.min(score, c.limit);
    score = Math.max(0, round1(score));

    let verdict;
    if (caps.length) verdict = 'ALTO_RIESGO';
    else if (counts.risk || counts.warn) verdict = 'REPARABLE';
    else if (undetermined.length && !findings.length) verdict = 'NO_SE_PUEDE_DETERMINAR';
    else if (undetermined.length) verdict = 'REPARABLE';
    else verdict = 'LISTO';

    return {
      verdict: verdict,
      score: score,
      max: MAX_SCORE,
      findings: findings,
      deductions: deductions,
      caps: caps,
      undetermined: undetermined,
      counts: counts,
      has_config: !!Object.keys(cfg).length
    };
  }

  function round1(n) { return Math.round(n * 10) / 10; }

  root.LogDiagnosis = { analyze: analyze, parseConfig: parseConfig, GUIDES: GUIDES };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.LogDiagnosis;
  }
})(typeof window !== 'undefined' ? window : globalThis);
