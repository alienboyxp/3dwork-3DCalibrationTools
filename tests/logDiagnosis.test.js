// =====================================================
// logDiagnosis.test.js – tests del motor de diagnóstico
// Ejecutar: node tests/logDiagnosis.test.js
//
// Incluye la validación contra el fixture real del caso
// Medusa (BIQU/BTT, Eddy-NG, CB2) si está disponible en
// ../3dwork-ai-staff/tmp/klipper_logs_medusa_20261022/
// =====================================================
'use strict';

const fs = require('fs');
const path = require('path');
const LD = require('../src/components/logDiagnosis.js');

let pass = 0, fail = 0;
function check(name, cond, extra) {
    if (cond) { pass++; console.log('  ✓ ' + name); }
    else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}

function finding(diag, id) {
    return diag.findings.find(f => f.id === id) || null;
}

// ── Fixture sintético mínimo (derivado del caso real) ──────────────────
const SYNTH_KLIPPY = [
    "Starting Klippy...",
    "Args: ['/home/biqu/klipper/klippy/klippy.py']",
    "Git version: 'v0.13.0-813-ga08fc79f-dirty'",
    "Untracked files: klippy/extras/autotune_tmc.py, klippy/extras/ldc1612_ng.py, klippy/extras/pin_watch.py, (+7 files)",
    "Device: BigTreeTech CB2",
    "Start printer at Thu Oct 22 18:42:31 2026 (1792694551.1 1617.6)",
    "===== Config file =====",
    "[extruder]",
    "rotation_distance = 40",
    "microsteps = 16",
    "===== Config file end =====",
    "Loaded MCU 'eddy' 147 commands (v0.13.0-813-ga08fc79f / gcc)",
    "Configured MCU 'mcu' (1024 moves)",
    "Protocol error",
    "Traceback (most recent call last):",
    "  File \"/home/biqu/klipper/klippy/mcu.py\", line 115, in __init__",
    "  File \"/home/biqu/klipper/klippy/extras/ldc1612_ng.py\", line 244, in _build_config",
    "msgproto.error: mcu 'eddy': Unknown command: ldc1612_ng_start_stop",
    "MCU Protocol error",
    "",
    "This is frequently caused by running an older version of the",
    "firmware on the MCU(s). Fix by recompiling and flashing the",
    "firmware.",
    "",
    "Your Klipper version is: v0.13.0-813-ga08fc79f-dirty",
    "MCU(s) which should be updated:",
    "mcu: Current version v0.13.0-813-ga08fc79f",
    "eddy: Current version v0.13.0-813-ga08fc79f",
    "Up-to-date MCU(s):",
    "<none>",
    "",
    "Start printer at Thu Oct 22 18:42:51 2026 (1792694571.5 33.4)",
    "mcu 'eddy': Unknown command: ldc1612_ng_start_stop",
    "pin_watch io: t0 -> 1 (t=42.667058)",
    "pin_watch io: failed to set T0.color",
    "gcode.CommandError: MCU Protocol error",
    "pin_watch io: toolchanger sync failed",
    "mcu 'eddy': Unknown command: ldc1612_ng_start_stop",
    ""
].join('\n');

const SYNTH_MOONRAKER = [
    "-------------------- Log Start | Thu Oct 22 18:42:29 2026 --------------------",
    "software_version: v0.11.0-3-g9e676eb",
    "[update_manager klipper-mcu-updater]",
    "type = git_repo",
    "path = /home/biqu/klipper-mcu-updater",
    "origin = https://github.com/GmhF3NiX/klipper-mcu-updater.git",
    "Git Repo klipper-mcu-updater: No warnings detected",
    ""
].join('\n');

console.log('\n── Caso sintético (derivado del Medusa real) ──');
{
    const diag = LD.analyze({ klippy: SYNTH_KLIPPY, moonraker: SYNTH_MOONRAKER, config: '[extruder]\nrotation_distance = 40\nmicrosteps = 16' });

    // 1. Regla «Unknown command» de MCU
    const uc = finding(diag, 'unknown_command_mcu');
    check('unknown_command_mcu dispara', !!uc);
    check('  extrae el MCU afectado (eddy)', uc && /eddy/.test(uc.evidence), uc && uc.evidence);
    check('  extrae el comando (ldc1612_ng_start_stop)', uc && /ldc1612_ng_start_stop/.test(uc.evidence));
    check('  incluye la versión del host (-dirty)', uc && /-dirty/.test(uc.evidence));
    check('  lista los MCUs por actualizar', uc && /mcu \(v0\.13\.0/.test(uc.evidence) && /eddy \(v0\.13\.0/.test(uc.evidence));
    check('  severidad risk con tope 4', uc && uc.severity === 'risk' && uc.cap === 4);

    // 2. Sub-regla versiones idénticas (-dirty + untracked)
    const dirty = finding(diag, 'host_dirty_untracked');
    check('host_dirty_untracked dispara', !!dirty);
    check('  menciona el módulo untracked (ldc1612_ng.py)', dirty && /ldc1612_ng\.py/.test(dirty.evidence));
    check('  explica git describe/untracked en el porqué', dirty && /untracked|git describe/i.test(dirty.why));

    // 3. Bucle de reinicios
    const loop = finding(diag, 'restart_loop');
    check('restart_loop dispara', !!loop);
    check('  cuenta los arranques (2)', loop && /2 arranques/.test(loop.evidence), loop && loop.evidence);
    check('  cuenta las repeticiones del error', loop && /repetido \d+ veces/.test(loop.evidence));

    // 4. Errores en cascada
    const cascade = finding(diag, 'cascade_errors');
    check('cascade_errors dispara', !!cascade);
    check('  marca CommandError como consecuencia', cascade && /CommandError/.test(cascade.evidence));
    check('  severidad info (no resta como causa)', cascade && cascade.severity === 'info');

    // 5. KB sondas eddy
    const eddy = finding(diag, 'eddy_probe_kb');
    check('eddy_probe_kb dispara', !!eddy);
    check('  identifica la familia (Eddy NG / Cartographer)', eddy && /Eddy/i.test(eddy.title));

    // 6. klipper-mcu-updater presente (moonraker)
    const updater = finding(diag, 'mcu_updater_available');
    check('mcu_updater_available dispara (con moonraker)', !!updater);
    check('  sugiere MCU_SCAN/MCU_BACKUP', updater && /MCU_SCAN/.test(updater.fix) && /MCU_BACKUP/.test(updater.fix));

    // Sin duplicados: las reglas genéricas se inhiben
    check('mcu_protocol NO dispara (subsumida por la especializada)', !finding(diag, 'mcu_protocol'));
    check('invalid_command NO dispara (es del MCU)', !finding(diag, 'invalid_command'));
    check('python_error NO dispara (traceback del Unknown command)', !finding(diag, 'python_error'));

    // Veredicto: fallo grave → ALTO_RIESGO con tope 4
    check('veredicto ALTO_RIESGO', diag.verdict === 'ALTO_RIESGO', diag.verdict);
    check('nota tope 4', diag.score <= 4, 'score=' + diag.score);
}

console.log('\n── La regla del updater NO dispara sin moonraker ──');
{
    const diag = LD.analyze({ klippy: SYNTH_KLIPPY });
    check('sin moonraker no hay fix guiado', !finding(diag, 'mcu_updater_available'));
    // el resto sigue disparándose
    check('unknown_command_mcu sigue disparando', !!finding(diag, 'unknown_command_mcu'));
}

console.log('\n── Comandos de config normales (sin desajuste) ──');
{
    const diag = LD.analyze({
        klippy: 'Unknown command: M99X\nMCU Protocol error',
        config: ''
    });
    check('invalid_command dispara para comandos de config', !!finding(diag, 'invalid_command'));
    check('unknown_command_mcu NO dispara (no es de un MCU)', !finding(diag, 'unknown_command_mcu'));
}

console.log('\n── Log limpio ──');
{
    const diag = LD.analyze({
        klippy: 'Starting Klippy...\nGit version: \'v0.13.0-813-ga08fc79f\'\nStart printer at Thu Oct 22 18:42:31 2026\nLoaded MCU \'mcu\' 147 commands (v0.13.0-813-ga08fc79f)\nConfigured MCU \'mcu\' (1024 moves)\n',
        config: '[extruder]\nrotation_distance = 40\nmicrosteps = 16'
    });
    check('sin unknown_command_mcu', !finding(diag, 'unknown_command_mcu'));
    check('sin host_dirty_untracked', !finding(diag, 'host_dirty_untracked'));
    check('sin restart_loop (1 solo arranque)', !finding(diag, 'restart_loop'));
    check('sin cascade_errors', !finding(diag, 'cascade_errors'));
    check('sin eddy_probe_kb', !finding(diag, 'eddy_probe_kb'));
    check('sin mcu_updater_available', !finding(diag, 'mcu_updater_available'));
    check('veredicto LISTO', diag.verdict === 'LISTO', diag.verdict);
}

console.log('\n── Reglas de la revisión CODeRUS/competencia ──');
{
    // power_loss: NUL bytes (el host murió escribiendo el log)
    const pl = LD.analyze({ klippy: 'Starting Klippy...\nStats 1.0: mcu=0\n\u0000Starting Klippy...\n\u0000\n' });
    const f = finding(pl, 'power_loss');
    check('power_loss dispara con bytes NUL', !!f);
    check('  cuenta los bloques NUL', f && /2 bloques/.test(f.evidence), f && f.evidence);

    // unsafe_shutdowns: contador de moonraker
    const us = LD.analyze({ klippy: 'ok', moonraker: 'moonraker\nUnsafe Shutdown Count: 3\n' });
    const f2 = finding(us, 'unsafe_shutdowns');
    check('unsafe_shutdowns dispara con N>0', !!f2);
    check('  extrae el contador (3)', f2 && /: 3 /.test(f2.evidence), f2 && f2.evidence);
    const us0 = LD.analyze({ klippy: 'ok', moonraker: 'Unsafe Shutdown Count: 0\n' });
    check('unsafe_shutdowns NO dispara con 0', !finding(us0, 'unsafe_shutdowns'));

    // usb_instability: errores de USB en dmesg
    const dmesgBad = 'usb 1-1.3: new high-speed USB device\nusb 1-1.3: device descriptor read error\ncp210x converter now attached\nttyUSB0: I/O error\nusb 1-1.3: disabled by hub\n';
    const usb = LD.analyze({ klippy: 'ok', dmesg: dmesgBad });
    const f3 = finding(usb, 'usb_instability');
    check('usb_instability dispara con dmesg con errores', !!f3);
    check('  lista las señales (I/O error, disabled by hub)', f3 && /I\/O error/.test(f3.evidence) && /disabled by hub/.test(f3.evidence));
    const usbOk = LD.analyze({ klippy: 'ok', dmesg: 'usb 1-1.3: new high-speed USB device\n' });
    check('usb_instability NO dispara con dmesg limpio', !finding(usbOk, 'usb_instability'));

    // link_retransmits: retransmisiones en Stats
    const stats = 'Stats 10.0: mcu: bytes_write=123 bytes_retransmit=0\nStats 20.0: mcu: bytes_write=456 bytes_retransmit=64\nStats 30.0: mcu: bytes_write=789 bytes_retransmit=12\n';
    const lr = LD.analyze({ klippy: stats });
    const f4 = finding(lr, 'link_retransmits');
    check('link_retransmits dispara con retransmit>0', !!f4);
    check('  suma acumulado y pico', f4 && /acumulados: 76/.test(f4.evidence) && /pico 64/.test(f4.evidence), f4 && f4.evidence);
    const lr0 = LD.analyze({ klippy: 'Stats 10.0: mcu: bytes_write=123 bytes_retransmit=0\n' });
    check('link_retransmits NO dispara con 0', !finding(lr0, 'link_retransmits'));

    // moonraker_errors: FileNotFoundError / ShellCommandError
    const me = LD.analyze({ klippy: 'ok', moonraker: 'FileNotFoundError: /home/pi/notfound\nShellCommandError: failed\n' });
    const f5 = finding(me, 'moonraker_errors');
    check('moonraker_errors dispara', !!f5);
    check('  cuenta 1 FileNotFoundError y 1 ShellCommandError', f5 && /1 FileNotFoundError/.test(f5.evidence) && /1 ShellCommandError/.test(f5.evidence));

    // mcu_bus_pins: pines i2c de los MCUs (nuevo de CODeRUS feb-2026)
    const pinsLog = "MCU 'eddy' config: ADC_MAX=4095 BUS_PINS_i2c0a=gpio0,gpio1 CLOCK_FREQ=12000000 MCU=rp2040\n";
    const bp = LD.analyze({ klippy: pinsLog });
    const f6 = finding(bp, 'mcu_bus_pins');
    check('mcu_bus_pins dispara con BUS_PINS_i2c', !!f6);
    check('  etiqueta SDA/SCL correctamente', f6 && /SDA=gpio0/.test(f6.evidence) && /SCL=gpio1/.test(f6.evidence), f6 && f6.evidence);
    const bp0 = LD.analyze({ klippy: "MCU 'eddy' config: ADC_MAX=4095\n" });
    check('mcu_bus_pins NO dispara sin i2c', !finding(bp0, 'mcu_bus_pins'));

    // print_sessions: rotaciones de log e impresiones SD
    const jobs = 'Log rollover at Thu Oct 22 18:00:00 2026\nStart printing job (some.gcode)\nLog rollover at Thu Oct 22 20:00:00 2026\n';
    const ps = LD.analyze({ klippy: jobs });
    const f7 = finding(ps, 'print_sessions');
    check('print_sessions dispara con rollovers', !!f7);
    check('  cuenta 2 rotaciones', f7 && /2 rotaciones/.test(f7.evidence), f7 && f7.evidence);
    const ps0 = LD.analyze({ klippy: 'Starting Klippy...\n' });
    check('print_sessions NO dispara sin jobs', !finding(ps0, 'print_sessions'));
}

console.log('\n── Bed mesh + historial de impresiones + termistor (ideas de Klippylyzer) ──');
{
    // parseBedMeshProfiles: formato del config dump del klippy.log (sin #*#)
    const cfg = [
        '[bed_mesh]',
        'speed = 50',
        '',
        '[bed_mesh default]',
        'version = 1',
        'points = ',
        '\t0.400, 0.300, 0.200',
        '\t0.100, 0.000, -0.100',
        'x_count = 3',
        'y_count = 2',
        'algo = lagrange',
        'min_x = 20.0',
        'max_x = 200.0',
        'min_y = 20.0',
        'max_y = 190.0',
        ''
    ].join('\n');
    const profiles = LD.parseBedMeshProfiles(cfg);
    check('parseBedMeshProfiles extrae el perfil', profiles.length === 1);
    check('  nombre del perfil (bed_mesh default)', profiles[0] && profiles[0].name === 'bed_mesh default');
    check('  matriz 3×2', profiles[0] && profiles[0].points.length === 2 && profiles[0].points[0].length === 3);
    check('  límites de sondado', profiles[0] && profiles[0].minX === 20 && profiles[0].maxX === 200 && profiles[0].minY === 20 && profiles[0].maxY === 190);
    const none = LD.parseBedMeshProfiles('[extruder]\nrotation_distance = 40\n');
    check('sin bed_mesh no devuelve perfiles', none.length === 0);
    // la sección [bed_mesh] (config, sin puntos) no cuenta como perfil
    const onlyCfg = LD.parseBedMeshProfiles('[bed_mesh]\nspeed = 50\n');
    check('[bed_mesh] sin puntos no es perfil', onlyCfg.length === 0);

    // parsePrintJobs: ciclo de vida de virtual_sdcard
    const logJobs = [
        'File opened: /home/pi/gcodes/benchy.gcode File size: 12345',
        'Starting SD card print',
        'Finished SD card print',
        'File opened: /home/pi/gcodes/cube.gcode File size: 999',
        'Starting SD card print',
        'Exiting SD card',
        ''
    ].join('\n');
    const jobs = LD.parsePrintJobs(logJobs);
    check('parsePrintJobs extrae 2 jobs', jobs.length === 2, JSON.stringify(jobs));
    check('  job 1: benchy terminada', jobs[0] && jobs[0].file === 'benchy.gcode' && jobs[0].outcome === 'finished');
    check('  job 2: cube cancelada', jobs[1] && jobs[1].file === 'cube.gcode' && jobs[1].outcome === 'aborted');
    const noJobs = LD.parsePrintJobs('Starting Klippy...\nStats 1.0: ok\n');
    check('sin jobs devuelve vacío', noJobs.length === 0);

    // thermistor_drop: caída súbita con target caliente
    const statsBad = [
        'Stats 10.0: extruder: target=210 temp=209.5 pwm=0.400 heater_bed: target=60 temp=59.8 pwm=0.300',
        'Stats 15.0: extruder: target=210 temp=208.9 pwm=0.400 heater_bed: target=60 temp=59.7 pwm=0.300',
        'Stats 20.0: extruder: target=210 temp=152.0 pwm=1.000 heater_bed: target=60 temp=59.7 pwm=0.300',
        ''
    ].join('\n');
    const td = LD.analyze({ klippy: statsBad });
    const f = finding(td, 'thermistor_drop');
    check('thermistor_drop dispara con caída de 57°C', !!f);
    check('  evidencia con hotend y valores', f && /hotend/.test(f.evidence) && /208\.9→152/.test(f.evidence), f && f.evidence);
    // cooldown normal (target baja antes): NO dispara
    const statsCool = [
        'Stats 10.0: extruder: target=210 temp=209.5 pwm=0.400',
        'Stats 15.0: extruder: target=0 temp=209.0 pwm=0.000',
        'Stats 20.0: extruder: target=0 temp=150.0 pwm=0.000',
        ''
    ].join('\n');
    const tc = LD.analyze({ klippy: statsCool });
    check('cooldown normal NO dispara', !finding(tc, 'thermistor_drop'));
}

console.log('\n── klippy_mcu_mismatch (regla preexistente arreglada) ──');
{
    // versiones iguales a nivel de commit → no dispara (el -dirty es del árbol)
    const same = LD.analyze({
        klippy: "Git version: 'v0.13.0-813-ga08fc79f-dirty'\nLast MCU build version: v0.13.0-813-ga08fc79f\nLast MCU build config: MCU=linux\n",
        config: ''
    });
    check('versiones iguales (con -dirty): no dispara', !finding(same, 'klippy_mcu_mismatch'));

    // build del MCU más vieja que el host → dispara con evidencia limpia
    const older = LD.analyze({
        klippy: "Git version: 'v0.13.0-900-gabcdef1'\nLast MCU build version: v0.12.0-100-g1111111\nLast MCU build config: MCU=linux\n",
        config: ''
    });
    const mm = finding(older, 'klippy_mcu_mismatch');
    check('build del MCU más vieja: dispara', !!mm);
    check('  evidencia con las dos versiones', mm && /v0\.13\.0-900/.test(mm.evidence) && /v0\.12\.0-100/.test(mm.evidence), mm && mm.evidence);
}

console.log('\n── Sub-regla exige AMBOS: -dirty Y módulo untracked ──');
{
    // host limpio (sin -dirty): la sub-regla no dispara aunque haya untracked
    const noDirty = SYNTH_KLIPPY.replace("-dirty'", "'").replace('Your Klipper version is: v0.13.0-813-ga08fc79f-dirty', 'Your Klipper version is: v0.13.0-813-ga08fc79f');
    const diag = LD.analyze({ klippy: noDirty, moonraker: SYNTH_MOONRAKER });
    check('sin -dirty no hay diagnóstico afirmativo', !finding(diag, 'host_dirty_untracked'));
    check('pero unknown_command_mcu sigue disparando', !!finding(diag, 'unknown_command_mcu'));
}

// ── Validación contra el fixture REAL del caso Medusa ───────────────────
const FIXTURE_DIR = path.join(__dirname, '..', '..', '3dwork-ai-staff', 'tmp', 'klipper_logs_medusa_20261022');
if (fs.existsSync(path.join(FIXTURE_DIR, 'klippy.log'))) {
    console.log('\n── Fixture REAL del caso Medusa (BIQU/BTT Eddy-NG) ──');
    const klippy = fs.readFileSync(path.join(FIXTURE_DIR, 'klippy.log'), 'utf8');
    const moonraker = fs.readFileSync(path.join(FIXTURE_DIR, 'moonraker.log'), 'utf8');
    const cfgText = fs.readFileSync(path.join(FIXTURE_DIR, 'printer.cfg'), 'utf8');
    const dmesgPath = path.join(FIXTURE_DIR, 'dmesg.txt');
    const dmesg = fs.existsSync(dmesgPath) ? fs.readFileSync(dmesgPath, 'utf8') : '';
    const diag = LD.analyze({ klippy, moonraker, dmesg, config: cfgText });

    check('REAL: unknown_command_mcu dispara', !!finding(diag, 'unknown_command_mcu'));
    check('REAL: host_dirty_untracked dispara', !!finding(diag, 'host_dirty_untracked'));
    check('REAL: restart_loop dispara', !!finding(diag, 'restart_loop'));
    check('REAL: cascade_errors dispara', !!finding(diag, 'cascade_errors'));
    check('REAL: eddy_probe_kb dispara', !!finding(diag, 'eddy_probe_kb'));
    check('REAL: mcu_updater_available dispara', !!finding(diag, 'mcu_updater_available'));
    check('REAL: mcu_protocol suprimida', !finding(diag, 'mcu_protocol'));
    check('REAL: invalid_command suprimida', !finding(diag, 'invalid_command'));
    check('REAL: python_error suprimida', !finding(diag, 'python_error'));
    check('REAL: klippy_mcu_mismatch no dispara (commit igual, -dirty aparte)', !finding(diag, 'klippy_mcu_mismatch'));
    check('REAL: veredicto ALTO_RIESGO', diag.verdict === 'ALTO_RIESGO', diag.verdict);
    check('REAL: nota ≤ 4', diag.score <= 4, 'score=' + diag.score);
    const uc = finding(diag, 'unknown_command_mcu');
    if (uc) console.log('    evidencia: ' + uc.evidence.slice(0, 140));
    const dirty = finding(diag, 'host_dirty_untracked');
    if (dirty) console.log('    confirmación: ' + dirty.evidence.slice(0, 140));
} else {
    console.log('\n── Fixture real no disponible (se omite; los tests sintéticos ya validan) ──');
}

console.log(`\n${pass} correctas, ${fail} fallidas\n`);
process.exit(fail ? 1 : 0);
