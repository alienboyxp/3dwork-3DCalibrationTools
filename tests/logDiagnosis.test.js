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
    const diag = LD.analyze({ klippy, moonraker, config: cfgText });

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
