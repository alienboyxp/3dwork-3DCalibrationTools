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
      // si hay un «mcu 'x': Unknown command» la regla especializada
      // unknown_command_mcu da el diagnóstico concreto: evitamos duplicar
      detect: (log) => {
        if (/mcu '[^']*': Unknown command/i.test(log)) return null;
        return firstMatch(log, [
          /MCU Protocol error/i,
          /Protocol error/i,
          /Unable to extract params/i,
          /bytes_per_report/i
        ]);
      },
      title: 'El firmware del MCU no habla el mismo idioma que Klipper',
      why: 'Los parámetros que manda Klipper no coinciden con los que entiende el MCU: la impresión va a fallar o a imprimir con parámetros equivocados.',
      fix: 'Actualiza el firmware del MCU a la misma versión que la de Klipper (el propio log indica el comando).',
      guide: 'klipper'
    },
    {
      // Caso real Medusa (BIQU/BTT, Eddy-NG, CB2): el host se actualizó con
      // módulos nuevos (ldc1612_ng) sin re-flashear el MCU del probe (RP2040)
      // → «Unknown command» → Protocol error → klippy no arranca.
      id: 'unknown_command_mcu', sev: 'risk', cap: HARD_CAP,
      detect: (log) => {
        const uc = parseUnknownCommand(log);
        if (!uc) return null;
        if (!/MCU Protocol error/i.test(log)) return null;
        const host = parseHostVersion(log);
        const outdated = parseShouldUpdate(log);
        let ev = "mcu '" + uc.mcu + "' no reconoce el comando «" + uc.cmd + "»";
        if (host) ev += ' — versión del host: ' + host;
        if (outdated.length) {
          ev += ' — MCUs por actualizar: ' +
            outdated.map(function (u) { return u.mcu + ' (' + u.version + ')'; }).join(', ');
        }
        return ev;
      },
      title: 'El MCU no reconoce un comando: host y firmware desajustados',
      why: 'Klipper (host) pide un comando que el firmware del MCU no tiene: ' +
        'sucede al actualizar el código de Klipper sin re-compilar y re-flashear ' +
        'el firmware del MCU. La impresora no puede arrancar mientras no coincidan.',
      fix: 'Re-compila y flashea el firmware del MCU afectado con el código ' +
        'de Klipper que está corriendo ahora mismo en el host (make flash / ' +
        'make flash USB, o la herramienta de actualización de MCUs de tu máquina).',
      guide: 'klipper'
    },
    {
      // Sub-regla del caso «misma cadena de versión»: el host reporta
      // v0.13.0-813-ga08fc79f-dirty y el MCU v0.13.0-813-ga08fc79f — parece
      // «la misma versión», pero el comando desconocido viene de un módulo
      // listado en «Untracked files:». git describe ignora los ficheros
      // untracked → misma cadena ≠ mismo binario. Diagnóstico afirmativo.
      id: 'host_dirty_untracked', sev: 'warn',
      detect: (log) => {
        const uc = parseUnknownCommand(log);
        if (!uc) return null;
        const host = parseHostVersion(log);
        if (!host || !/-dirty$/.test(host)) return null;
        const untracked = parseUntracked(log);
        if (!untracked.length) return null;
        // ¿El comando pertenece a un módulo untracked? (klippy/extras/<base>.py)
        const module = untracked.find(u =>
          uc.cmd === u.base || uc.cmd.indexOf(u.base + '_') === 0);
        if (!module) return null;
        return 'host ' + host + ' con «Untracked files» que incluyen ' +
          module.file + ' → el comando «' + uc.cmd + '» es de ese módulo';
      },
      title: 'Misma cadena de versión, distinto binario: host actualizado sin flashear el MCU',
      why: '«' + 'git describe' + '» ignora los ficheros sin trackear: el host y el MCU ' +
        'pueden reportar la MISMA cadena de versión y aun así correr binarios ' +
        'distintos. Aquí el host incorpora un módulo nuevo (untracked) que el ' +
        'firmware del MCU nunca llegó a recibir porque no se re-flasheó.',
      fix: 'Diagnóstico confirmado: re-flashea el firmware del MCU con el código ' +
        'actual del host. La cadena de versión «igual» no te va a avisar: tras ' +
        'cualquier actualización de Klipper que añada módulos, flashea SIEMPRE ' +
        'los MCUs antes de arrancar.',
      guide: 'klipper'
    },
    {
      id: 'restart_loop', sev: 'warn',
      detect: (log) => {
        const starts = countMatches(log, /^Start printer at /gm);
        if (starts < 2) return null;
        const uc = parseUnknownCommand(log);
        const errRe = uc
          ? new RegExp(uc.mcu + "': Unknown command: " + uc.cmd, 'g')
          : /MCU Protocol error/g;
        const errs = countMatches(log, errRe);
        return starts + ' arranques de klippy («Start printer at») y el error ' +
          'fatal repetido ' + errs + ' veces → klippy está en bucle';
      },
      title: 'Klippy arranca y petar en bucle',
      why: 'El mismo error fatal aparece en cada arranque: reiniciar no arregla ' +
        'nada (el desajuste host↔MCU sigue ahí) y la impresora queda inutilizada.',
      fix: 'Arregla el error de fondo (re-flashea el MCU) antes de volver a ' +
        'arrancar; los reinicios solo repiten el fallo.',
      guide: 'klipper'
    },
    {
      id: 'cascade_errors', sev: 'info',
      detect: (log) => {
        // solo tiene sentido si hay un fallo principal previo
        if (!/MCU Protocol error|Transition to shutdown state|MCU '.*' shutdown:/i.test(log)) return null;
        const parts = [];
        if (/gcode\.CommandError: MCU Protocol error/i.test(log)) parts.push('gcode rechazado en estado de error (CommandError)');
        if (/pin_watch[^:]*: failed to set/i.test(log)) parts.push('pin_watch no pudo aplicar comandos');
        if (/toolchanger sync failed/i.test(log)) parts.push('sincronización del toolchanger fallida');
        if (!parts.length) return null;
        return parts.join(' · ');
      },
      title: 'Errores en cascada: son CONSECUENCIA del fallo principal',
      why: 'Cuando la impresora entra en estado de error, todos los comandos ' +
        'gcode y los temporizadores de módulos (toolchanger, pin_watch, macros) ' +
        'se rechazan y dejan su propio rastro de errores. No son causas ' +
        'independientes: perseguirlos es perseguir humo.',
      fix: 'Ignora estos errores secundarios: arregla el fallo principal ' +
        '(desajuste host↔MCU) y toda la cascada desaparece.',
      guide: 'klipper'
    },
    {
      // KB: familia de sondas por inducción (eddy) — BTT Eddy NG / Cartographer
      id: 'eddy_probe_kb', sev: 'info',
      detect: (log) => {
        const marks = [];
        if (/ldc1612/i.test(log)) marks.push('ldc1612');
        if (/probe_eddy_ng/i.test(log)) marks.push('probe_eddy_ng');
        if (/PROBE_EDDY_NG_(TAP|STATUS)/i.test(log)) marks.push('PROBE_EDDY_NG_*');
        if (/cartographer/i.test(log)) marks.push('cartographer');
        if (!marks.length) return null;
        return 'Señales de sonda inductiva eddy: ' + marks.join(', ');
      },
      title: 'Sonda tipo Eddy (BTT Eddy-NG / Cartographer): firmware del MCU del probe',
      why: 'Las sondas eddy (BTT Eddy NG, Cartographer) usan un MCU propio ' +
        '(normalmente RP2040) con el módulo ldc1612/probe_eddy_ng. Cualquier ' +
        'actualización del host que toque ese módulo exige re-flashear el MCU ' +
        'de la sonda o aparecerá «Unknown command» (ldc1612_ng_start_stop, ' +
        'query_ldc1612_status, PROBE_EDDY_NG_STATUS…).',
      fix: 'Re-flashea el MCU de la sonda eddy con el código actual de Klipper. ' +
        'En las BIQU/BTT (Medusa, CB2) el flujo habitual es klipper-mcu-updater.',
      guide: 'klipper'
    },
    {
      // Cable de termistor roto/intermitente (la feature estrella de Klippylyzer):
      // con el target caliente, la lectura se cae de golpe entre muestras de
      // Stats — físicamente imposible con el calefactor encendido.
      id: 'thermistor_drop', sev: 'warn',
      detect: (log) => {
        const s = sampleHeaterTemps(log);
        const scan = function (arr, hot, drop, label) {
          for (let i = 1; i < arr.length; i++) {
            if (arr[i - 1].v >= hot && arr[i].t >= hot && (arr[i - 1].v - arr[i].v) > drop) {
              return label + ': ' + arr[i - 1].v.toFixed(1) + '→' +
                arr[i].v.toFixed(1) + ' °C con target ' + arr[i].t.toFixed(0) +
                ' °C entre dos muestras';
            }
          }
          return null;
        };
        return scan(s.extruder, 150, 40, 'hotend') ||
               scan(s.bed, 40, 20, 'cama') || null;
      },
      title: 'El termistor se cae de golpe: posible cable roto',
      why: 'Con el calefactor encendido, un descenso instantáneo de decenas de ' +
        'grados no es enfriamiento: es un termistor con el cable pelado o el ' +
        'conector flojo. Si pasa a mitad de impresión, klipper corta con «Thermal ' +
        'Runaway» o imprime con temperaturas inventadas.',
      fix: 'Revisa el cable del termistor en toda su ruta (cadenetas, cabezal, ' +
        'conector en la placa) y vuelve a fijarlo lejos de los cables de motores. ' +
        'Si el conector está sucio, limpieza con alcohol y reseat.',
      guide: 'labs'
    },
    {
      // CODeRUS lo detecta como «Unexpected end of block»: si el log tiene
      // bytes NUL antes de un «Starting Klippy», el host murió de golpe
      // (apagón/reset) mientras escribía el log.
      id: 'power_loss', sev: 'warn',
      detect: (log) => {
        const nuls = countMatches(log, /\u0000+/g);
        if (!nuls) return null;
        const starts = countMatches(log, /^Starting Klippy/gm);
        return 'bytes NUL en el log (' + nuls + ' bloques) con ' +
          starts + ' arranques → el host se apagó de golpe al menos una vez';
      },
      title: 'El host se apagó sin orden (apagón o reset)',
      why: 'El log se corta en seco con bytes vacíos: la Raspberry/SBC perdió ' +
        'alimentación o se colgó. Un apagón a mitad de impresión deja la pieza ' +
        'pegada a la cama y puede dañar la SD.',
      fix: 'Revisa la alimentación (fuente del SBC, cable USB de datos, si el ' +
        'SD card se corrompe) y añade un filtro/UPS si es habitual.',
      guide: 'klipper'
    },
    {
      // moonraker.log guarda «Unsafe Shutdown Count: N»: cuántas veces se
      // cortó la corriente al sistema sin apagado limpio.
      id: 'unsafe_shutdowns', sev: 'warn',
      detect: (log, cfg, ctx) => {
        const mr = (ctx && ctx.moonraker) || '';
        const m = mr.match(/Unsafe Shutdown Count:?\s*(\d+)/i);
        if (!m) return null;
        const n = parseInt(m[1], 10);
        if (!n) return null;
        return 'Unsafe Shutdown Count: ' + n + ' (moonraker.log)';
      },
      title: 'El sistema lleva varios apagones sucios',
      why: 'Moonraker cuenta las veces que la máquina perdió corriente sin ' +
        'apagar bien: cada corte puede corromper la SD y corta impresiones.',
      fix: 'Revisa la alimentación del SBC (fuente, conector, regulador). Si la ' +
        'impresora comparte regleta con la calefacción, los picos de arranque ' +
        'pueden tumbar el host.',
      guide: 'klipper'
    },
    {
      // dmesg con errores de USB: la causa nº1 de «MCU desconectado» a mitad
      // de impresión. (Idea de CODeRUS: extrae las líneas rojas del dmesg.)
      id: 'usb_instability', sev: 'risk',
      detect: (log, cfg, ctx) => {
        const dmesg = (ctx && ctx.dmesg) || '';
        if (!dmesg) return null;
        const marks = [];
        if (/I\/O error/i.test(dmesg)) marks.push('I/O error');
        if (/disabled by hub/i.test(dmesg)) marks.push('disabled by hub');
        if (/cannot enable\b|cannot reset\b|annot enable/i.test(dmesg)) marks.push('cannot enable/reset');
        if (/device descriptor (read )?error/i.test(dmesg)) marks.push('device descriptor error');
        if (/device disconnected/i.test(dmesg)) marks.push('device disconnected');
        if (!marks.length) return null;
        return marks.join(' · ') + ' en dmesg';
      },
      title: 'El USB da errores: el MCU puede desconectarse solo',
      why: 'El kernel ve fallos de USB (conexiones que se caen o no se ' +
        'pueden habilitar): es la causa clásica de que la impresora se pare ' +
        'a mitad de pieza con «Lost communication with MCU».',
      fix: 'Cambia el cable USB por uno corto con ferritas y de datos (no de ' +
        'carga), prueba otro puerto (USB2 directo a la placa, sin hub) y ' +
        'aleja el cable de los motores y la cama caliente.',
      guide: 'klipper'
    },
    {
      // Retransmisiones en el bus serie/CAN: el link pierde paquetes.
      // (sineos las añadió a sus gráficas; aquí van al diagnóstico.)
      id: 'link_retransmits', sev: 'warn',
      detect: (log) => {
        const re = /bytes_retransmit=(\d+)/g;
        let m, total = 0, max = 0;
        while ((m = re.exec(log))) {
          const v = parseInt(m[1], 10);
          total += v;
          if (v > max) max = v;
        }
        if (!total) return null;
        return 'bytes_retransmit acumulados: ' + total + ' (pico ' + max + ' en una muestra)';
      },
      title: 'El enlace con el MCU retransmite paquetes',
      why: 'Klipper reenvía datos que no llegaron bien: el cable (USB/CAN) ' +
        'interfiere o es demasiado largo. En CAN suele ser el cable sin ' +
        'par trenzado o sin terminador de 120 Ω.',
      fix: 'Revisa el cableado USB/CAN (par trenzado, terminadores, ferritas, ' +
        'alejado de motores y calefactores) y la calidad de la fuente.',
      guide: 'klipper'
    },
    {
      // moonraker con ficheros que faltan o comandos de shell fallidos
      // (extracción nueva de CODeRUS, feb-2026)
      id: 'moonraker_errors', sev: 'info',
      detect: (log, cfg, ctx) => {
        const mr = (ctx && ctx.moonraker) || '';
        if (!mr) return null;
        const nf = countMatches(mr, /FileNotFoundError:/g);
        const se = countMatches(mr, /ShellCommandError:/g);
        if (!nf && !se) return null;
        const parts = [];
        if (nf) parts.push(nf + ' FileNotFoundError');
        if (se) parts.push(se + ' ShellCommandError');
        return parts.join(' · ') + ' en moonraker.log';
      },
      title: 'Moonraker reporta ficheros o comandos que fallan',
      why: 'Moonraker no encuentra ficheros o sus comandos de sistema fallan: ' +
        'suele ser una instalación a medias (extensiones sin instalar, ' +
        'rutas movidas) más que un problema de impresión.',
      fix: 'Revisa las líneas en moonraker.log: reinstala la extensión o ' +
        'corrige la ruta que falla (no suele afectar a la impresión).',
      guide: 'klipper'
    },
    {
      // Pines del MCU expuestos en el log (CODeRUS los parsea para ver
      // dónde conectar sondas i2c/spi). Solo si hay pines i2c (útil).
      id: 'mcu_bus_pins', sev: 'info',
      detect: (log) => {
        const out = [];
        const re = /MCU '([^']+)'.*?BUS_PINS_(i2c\d+[a-z])=([\w,]+)/gi;
        let m;
        const seen = {};
        while ((m = re.exec(log))) {
          const key = m[1] + ':' + m[2];
          if (seen[key]) continue;
          seen[key] = true;
          const pins = m[3].split(',');
          const labels = ['SDA', 'SCL'];
          out.push(m[1] + ' ' + m[2] + ' (' + pins.map(function (p, i) {
            return (labels[i] || 'pin' + i) + '=' + p;
          }).join(', ') + ')');
        }
        if (!out.length) return null;
        return out.slice(0, 4).join(' · ');
      },
      title: 'Pines I2C disponibles en tus MCUs',
      why: 'El log expone los pines de cada MCU: útil para conectar sondas ' +
        'eddy, Cartographer o cualquier periférico i2c en el bus correcto.',
      fix: 'No es un error: usa estos pines (SDA/SCL) al conectar tu sonda ' +
        'o sensor i2c al MCU que quieras.',
      guide: 'tools'
    },
    {
      // Sesiones de impresión en el log (CODeRUS/Klippylyzer listan jobs):
      // «Log rollover at» marca cada rotación (una por arranque de impresión).
      id: 'print_sessions', sev: 'info',
      detect: (log) => {
        const rollovers = countMatches(log, /^Log rollover at /gm);
        const sdPrints = countMatches(log, /^Starting SD card print/gm);
        if (!rollovers && !sdPrints) return null;
        const parts = [];
        if (rollovers) parts.push(rollovers + ' rotaciones de log');
        if (sdPrints) parts.push(sdPrints + ' impresiones desde SD');
        return parts.join(' · ');
      },
      title: 'Sesiones de impresión en el log',
      why: 'El log mezcla varias sesiones: al leer gráficas y errores, ' +
        'recuerda que puede haber varios arranques con impresiones distintas.',
      fix: 'No es un fallo: es contexto para interpretar el resto del análisis.',
      guide: 'klipper'
    },
    {
      // Fix guiado: klipper-mcu-updater presente (moonraker update_manager)
      id: 'mcu_updater_available', sev: 'info',
      detect: (log, cfg, ctx) => {
        const hay = [log, (ctx && ctx.moonraker) || ''].join('\n');
        if (!/klipper-mcu-updater/i.test(hay)) return null;
        return 'update_manager con klipper-mcu-updater presente en el sistema';
      },
      title: 'Tienes klipper-mcu-updater: re-flashea el MCU con él',
      why: 'La herramienta de actualización de MCUs ya está instalada: no ' +
        'necesitas flashear a mano con make flash.',
      fix: 'Ejecuta MCU_SCAN para localizar los MCUs y re-flashea el afectado ' +
        'desde el updater (haz MCU_BACKUP antes si quieres copia de seguridad). ' +
        'Después, RESTART de klippy y el «Unknown command» desaparece.',
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
      id: 'extrude_below_temp', sev: 'warn',
      detect: (log) => firstMatch(log, [
        /Extrude below minimum temp/i,
        /Move out of range: .*extruder/i,
        /Heating failed/i
      ]),
      title: 'El extrusor intentó extruir sin llegar a temperatura',
      why: 'Si el hotend está por debajo del mínimo, el filamento no fluye: la capa sale con huecos y la máquina se atasca.',
      fix: 'Sube la temperatura objetivo del hotend para ese material y revisa que el termistor mida bien (si marca menos de lo real, el slicer cree que está caliente antes de tiempo).',
      guide: 'labs'
    },
    {
      id: 'homing_failed', sev: 'warn',
      detect: (log) => firstMatch(log, [
        /Homing failed/i,
        /Endstop .* still triggered/i,
        /Probe .* failed/i
      ]),
      title: 'El homing o el sondeo del sensor falló',
      why: 'Si el eje no sabe dónde está el origen, la primera capa sale malplacing y la pieza se despega.',
      fix: 'Comprueba el endstop o el sensor (BLTouch/CR touch), el valor de posición del fin de carrera y que el carro llegue a esa posición.',
      guide: 'labs'
    },
    {
      id: 'filament_runout', sev: 'warn',
      detect: (log) => firstMatch(log, [
        /Filament runout/i,
        /Runout detected/i
      ]),
      title: 'Se agotó el filamento o se saltó el sensor',
      why: 'La impresión sigue con el hueco de material: capas incompletas y la pieza no vale.',
      fix: 'Mira el sensor de filamento y el recorrido; si el sensor no está, añade un M600 (pausa) con el filamento.',
      guide: 'klipper'
    },
    {
      id: 'out_of_range', sev: 'warn',
      detect: (log) => firstMatch(log, [
        /Move out of range/i,
        /Probe out of range/i
      ]),
      title: 'Un movimiento se salió de los límites',
      why: 'Normalmente es que el objeto es más grande que la zona permitida o que los topes están mal ajustados.',
      fix: 'Revisa los limites de la cama y el tamaño del objeto; si es el BLTouch, su posición de montaje.',
      guide: 'labs'
    },
    {
      id: 'python_error', sev: 'risk',
      // si el traceback viene del «Unknown command» de un MCU, la regla
      // especializada unknown_command_mcu lo explica mejor: no duplicar
      detect: (log) => {
        if (/mcu '[^']*': Unknown command/i.test(log)) return null;
        return firstMatch(log, [
          /Python exception detected/i,
          /Traceback \(most recent call last\)/i,
          /Klippy exited/i
        ]);
      },
      title: 'Klipper Petó con un error de Python',
      why: 'Un módulo mal configurado (macro, sensor, display) tumba Klipper: no imprime nada hasta que lo arregles.',
      fix: 'Mira el traceback del log para saber qué módulo falla; comenta temporalmente la línea problemática del printer.cfg.',
      guide: 'klipper'
    },
    {
      id: 'invalid_command', sev: 'warn',
      // «Unknown command» de un MCU lo cubre unknown_command_mcu (con el
      // diagnóstico de desajuste host↔firmware); aquí solo comandos de config
      detect: (log) => {
        if (/mcu '[^']*': Unknown command/i.test(log)) return null;
        return firstMatch(log, [
          /Invalid command format/i,
          /Unknown command:? /i,
          /Bad command format/i
        ]);
      },
      title: 'Un comando del config no es válido',
      why: 'Suele ser un salto de línea pegado en el config o un typo en el nombre de una opción.',
      fix: 'Revisa las líneas que el log marca como error: casi siempre es un salto de línea de más al copiar y pegar.',
      guide: 'klipper'
    },
    {
      id: 'sd_write_fail', sev: 'warn',
      detect: (log) => firstMatch(log, [
        /OSError: \[Errno 28\] No space left/i,
        /No space left on device/i,
        /IO error.*SD card/i
      ]),
      title: 'La microSD se quedó sin espacio o falla',
      why: 'Klipper no puede guardar el estado: se para al final de la impresión o pierde la del medio.',
      fix: 'Libera espacio en la SD y, si es una tarjeta mala, cámbiala (usa tarjetas de marca: los fallos de escritura matan impresiones).',
      guide: 'klipper'
    },
    {
      id: 'klippy_mcu_mismatch', sev: 'warn',
      // solo si el MCU llegó a hablar (si no se conectó, el aviso de versión
      // sería un falso positivo: no hay build del MCU con el que comparar)
      detect: (log) => {
        if (!/Last MCU build config/i.test(log)) return null;
        if (/Unable to open serial port|Unable to connect/i.test(log)) return null;
        // versión real del host («Git version: '…'» / «Your Klipper version is: …»)
        // y de la última build del MCU («Last MCU build version: …»)
        const klippyBuild = parseHostVersion(log) || '';
        const mcuBuild = (log.match(/Last MCU build version: (\S+)/i) || [])[1] || '';
        if (!klippyBuild || !mcuBuild) return null;
        // compara a nivel de commit: -dirty solo describe el árbol de trabajo
        // actual (la build del MCU salió de un checkout limpio)
        const clean = function (v) { return v.replace(/-dirty$/, ''); };
        if (clean(klippyBuild) === clean(mcuBuild)) return null;
        return 'Klipper ' + klippyBuild + ' frente a última build del MCU ' + mcuBuild;
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

  // ── utilidades del desajuste host↔MCU (caso Medusa/Eddy-NG) ───────────────

  function countMatches(text, re) {
    const m = text.match(re);
    return m ? m.length : 0;
  }

  /** mcu 'eddy': Unknown command: ldc1612_ng_start_stop → {mcu:'eddy', cmd:'…'} */
  function parseUnknownCommand(log) {
    const m = log.match(/mcu '([^']+)': Unknown command: ([^\s\n']+)/i);
    return m ? { mcu: m[1], cmd: m[2] } : null;
  }

  /** Versión del host: «Git version: 'v0.13.0-813-ga08fc79f-dirty'» o
   *  «Your Klipper version is: …» (la del bloque de error). */
  function parseHostVersion(log) {
    let m = log.match(/Git version: '([^']+)'/i);
    if (m) return m[1];
    m = log.match(/Your Klipper version is: (\S+)/i);
    return m ? m[1] : null;
  }

  /** Bloque «MCU(s) which should be updated:» → [{mcu:'eddy', version:'v…'}]
   *  (deduplicado: el bloque se repite en cada intento de arranque). */
  function parseShouldUpdate(log) {
    const out = [];
    const seen = {};
    const lines = log.split('\n');
    let inBlock = false;
    for (const line of lines) {
      if (/^MCU\(s\) which should be updated:/i.test(line)) { inBlock = true; continue; }
      if (inBlock) {
        const m = line.match(/^(\S+): Current version (\S+)/i);
        if (m) {
          if (!seen[m[1]]) { seen[m[1]] = true; out.push({ mcu: m[1], version: m[2] }); }
          continue;
        }
        if (/^Up-to-date MCU/i.test(line)) { inBlock = false; continue; }
      }
    }
    return out;
  }

  /** Muestras de temperatura de los Stats: {extruder:[{t,v}], bed:[{t,v}]}
   *  (t=target, v=temp; orden-independiente dentro de la línea de Stats). */
  function sampleHeaterTemps(log) {
    const out = { extruder: [], bed: [] };
    if (!log) return out;
    const extRe = /(?:^|\s)extruder: target=(-?\d+(?:\.\d+)?) temp=(-?\d+(?:\.\d+)?)/;
    const bedRe = /(?:^|\s)heater_bed: target=(-?\d+(?:\.\d+)?) temp=(-?\d+(?:\.\d+)?)/;
    for (const line of log.split('\n')) {
      if (line.indexOf('Stats ') !== 0) continue;
      const me = line.match(extRe), mb = line.match(bedRe);
      if (me) out.extruder.push({ t: parseFloat(me[1]), v: parseFloat(me[2]) });
      if (mb) out.bed.push({ t: parseFloat(mb[1]), v: parseFloat(mb[2]) });
    }
    return out;
  }

  /** Perfiles de bed_mesh guardados en el config del log (o printer.cfg):
   *  [{name:'bed_mesh default', points:[[z...]], minX, maxX, minY, maxY}] */
  function parseBedMeshProfiles(cfgText) {
    const raw = [];
    if (!cfgText) return raw;
    let cur = null, inPoints = false;
    for (const rawLine of cfgText.split('\n')) {
      const line = rawLine.trim();
      const secM = line.match(/^(?:#\*#\s*)?\[(bed_mesh[^\]]*)\]$/i);
      if (secM) {
        if (cur && cur.points.length) raw.push(cur);
        const name = secM[1].trim();
        cur = /^bed_mesh\s+\S+/i.test(name) ? { name: name, points: [], kv: {} } : null;
        inPoints = false;
        continue;
      }
      if (!cur) continue;
      const kv = line.match(/^(\w+)\s*=\s*(.*)$/);
      if (kv) {
        inPoints = kv[1] === 'points';
        cur.kv[kv[1]] = kv[2].trim();
      } else if (inPoints && /^[-0-9.,\s]+$/.test(line)) {
        const row = line.split(',').map(function (s) { return parseFloat(s.trim()); })
          .filter(function (v) { return !isNaN(v); });
        if (row.length) cur.points.push(row);
      }
    }
    if (cur && cur.points.length) raw.push(cur);
    return raw.map(function (p) {
      return {
        name: p.name,
        points: p.points,
        minX: parseFloat(p.kv.min_x), maxX: parseFloat(p.kv.max_x),
        minY: parseFloat(p.kv.min_y), maxY: parseFloat(p.kv.max_y),
        xCount: parseInt(p.kv.x_count, 10) || p.points[0].length,
        yCount: parseInt(p.kv.y_count, 10) || p.points.length
      };
    });
  }

  /** Historial de impresiones del klippy.log:
   *  [{file, outcome}] — outcome: 'finished' | 'aborted' | 'unknown'.
   *  Ciclo de vida de virtual_sdcard: File opened / Starting SD card print /
   *  Finished SD card print / Exiting SD card. */
  function parsePrintJobs(log) {
    const jobs = [];
    if (!log) return jobs;
    let cur = null;
    for (const line of log.split('\n')) {
      let m = line.match(/File opened:\s*(\S+)/);
      if (m) {
        if (cur) jobs.push(cur);
        cur = { file: m[1].split('/').pop(), outcome: 'unknown' };
        continue;
      }
      if (/^Starting SD card print/.test(line)) {
        if (!cur) cur = { file: '(SD)', outcome: 'unknown' };
        continue;
      }
      if (/^Finished SD card print/.test(line)) {
        if (cur) { cur.outcome = 'finished'; jobs.push(cur); cur = null; }
        continue;
      }
      if (/^Exiting SD card/.test(line)) {
        if (cur) { cur.outcome = 'aborted'; jobs.push(cur); cur = null; }
      }
    }
    if (cur) jobs.push(cur);
    return jobs;
  }

  /** «Untracked files: klippy/extras/a.py, …, (+7 files)» →
   *  [{file:'klippy/extras/ldc1612_ng.py', base:'ldc1612_ng'}, …]
   *  base = nombre de fichero sin extensión (módulo). */
  function parseUntracked(log) {
    const m = log.match(/Untracked files: ([^\n]+)/i);
    if (!m) return [];
    const out = [];
    const seen = {};
    for (const raw of m[1].split(',')) {
      const file = raw.trim();
      if (!file || /^\(\+\d+ files?\)/i.test(file)) continue;
      const slash = file.lastIndexOf('/');
      const name = slash === -1 ? file : file.slice(slash + 1);
      const dot = name.lastIndexOf('.');
      const base = dot === -1 ? name : name.slice(0, dot);
      if (!base) continue;
      // solo módulos de código que generan comandos de firmware
      if (!/\.(py|c)$/i.test(name)) continue;
      if (!seen[file]) { seen[file] = true; out.push({ file: file, base: base }); }
    }
    return out;
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


  /** E-steps que está usando Klipper, deducidos de la config:
   *  E-steps = microsteps × pasos_vuelta / rotation_distance
   *  200 pasos/vuelta en motor 1.8 GT2 (rotation_distance ≈ 40)
   *  400 pasos/vuelta en motor 2.3 tipo Bambu (rotation_distance ≈ 8,06) */
  function deriveEsteps(cfg) {
    const ext = firstSectionStarting(cfg, 'extruder');
    if (!ext) return null;
    const rd = parseFloat(cfgGet(cfg, ext, 'rotation_distance'));
    const ms = parseInt(cfgGet(cfg, ext, 'microsteps'), 10);
    if (isNaN(rd) || isNaN(ms) || rd <= 0) return null;
    let stepsPerRev = 200;
    let stepAngle = 1.8;
    if (Math.abs(rd - 8.0588) / 8.0588 < 0.05) {
      stepsPerRev = 400; stepAngle = 2.3;
    } else if (Math.abs(rd - 40) / 40 > 0.1) {
      return null;   // geometría desconocida: no arriesgamos un E-steps inventado
    }
    return {
      esteps: Math.round(ms * stepsPerRev / rd * 100) / 100,
      microsteps: ms,
      rotation_distance: rd,
      steps_per_rev: stepsPerRev,
      step_angle: stepAngle
    };
  }

  /** Acciones sugeridas: abrir otra herramienta con los valores ya puestos */
  function buildActions(cfg) {
    const actions = [];
    const e = deriveEsteps(cfg);
    if (e) {
      actions.push({
        tool: 'esteps', label: 'Calibrar E-steps con estos valores',
        payload: {
          'current-val': e.esteps,
          'microsteps': String(e.microsteps),
          'motor-type': String(e.step_angle)
        },
        note: 'Klipper usa rotation_distance ' + e.rotation_distance +
          ' con ' + e.microsteps + ' microsteps → ' + e.esteps +
          ' steps/mm (asumiendo ' + e.steps_per_rev +
          ' pasos/vuelta; comprueba que coincide con tu slicer)'
      });
      actions.push({
        tool: 'rotation', label: 'Revisar el rotation distance',
        payload: {
          'rd-value': e.rotation_distance,
          'microsteps': e.microsteps,
          'step-angle': e.step_angle
        },
        note: 'El valor exacto que tienes en el config (' +
          e.rotation_distance + ' mm/vuelta)'
      });
    }
    // Driver TMC detectado → la calculadora de Vref
    for (const section of Object.keys(cfg)) {
      if (/^tmc\d+$/.test(section)) {
        const rs = parseFloat(cfg[section].sense_resistor);
        // el select usa los valores reales disponibles en el calculadora
        const RS_OPTIONS = ['0.11', '0.075', '0.1', '0.05', '0.2', '0.025'];
        let rsValue = null;
        if (!isNaN(rs)) {
          const match = RS_OPTIONS.find(o => Math.abs(parseFloat(o) - rs) < 0.001);
          rsValue = match || rs;
        }
        actions.push({
          tool: 'vref', label: 'Calcular el Vref del ' + section.toUpperCase(),
          payload: {
            'driver-type': section.toLowerCase(),
            'sense-resistor': rsValue
          },
          note: 'Detectado ' + section.toUpperCase() +
            (rsValue ? ' con Rsense ' + rsValue + ' Ω' : ' en tu configuración')
        });
        break;
      }
    }
    return actions;
  }

  // ── análisis ────────────────────────────────────────────────────────────

  function analyze(input) {
    const log = (input && input.klippy) || '';
    const cfg = parseConfig((input && input.config) || '');
    const ctx = { moonraker: (input && input.moonraker) || '', dmesg: (input && input.dmesg) || '' };
    const findings = [];
    const undetermined = [];

    for (const rule of RULES) {
      let ev = null;
      try { ev = rule.detect(log, cfg, ctx); } catch (e) { ev = null; }
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
      has_config: !!Object.keys(cfg).length,
      actions: buildActions(cfg),
      esteps: deriveEsteps(cfg)
    };
  }

  function round1(n) { return Math.round(n * 10) / 10; }

  root.LogDiagnosis = {
    analyze: analyze, parseConfig: parseConfig, GUIDES: GUIDES,
    parseBedMeshProfiles: parseBedMeshProfiles, parsePrintJobs: parsePrintJobs
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.LogDiagnosis;
  }
})(typeof window !== 'undefined' ? window : globalThis);
