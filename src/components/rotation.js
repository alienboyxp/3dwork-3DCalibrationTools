window.renderRotation = function (container, t) {
    container.innerHTML = `
        <div class="card">
            <h2><i data-lucide="refresh-cw"></i> ${t.rotation}</h2>

            <div class="form-group">
                <label>${t.rotMode}</label>
                <select id="rot-mode">
                    <option value="esteps">${t.rotFromEsteps}</option>
                    <option value="rd">${t.rotFromRD}</option>
                </select>
            </div>

            <div id="rot-inputs-esteps">
                <div class="form-group">
                    <label>${t.stepsPerMm}</label>
                    <input type="number" id="steps-per-mm" value="415" step="0.1">
                </div>
                <div class="form-group">
                    <label>${t.microsteps}</label>
                    <input type="number" id="microsteps" value="16" step="1">
                </div>
                <div class="form-group">
                    <label>${t.stepAngle}</label>
                    <select id="step-angle">
                        <option value="1.8">1.8° (200 ${t.stepsPerTurn})</option>
                        <option value="2.3">2.3° (400 ${t.stepsPerTurn})</option>
                        <option value="0.9">0.9° (400 ${t.stepsPerTurn})</option>
                    </select>
                </div>
            </div>

            <div id="rot-inputs-rd" style="display:none;">
                <div class="form-group">
                    <label>${t.rotRDCurrent}</label>
                    <input type="number" id="rd-value" value="40" step="0.0001">
                </div>
                <div class="form-group">
                    <label>${t.microsteps}</label>
                    <input type="number" id="microsteps-rd" value="16" step="1">
                </div>
                <div class="form-group">
                    <label>${t.stepAngle}</label>
                    <select id="step-angle-rd">
                        <option value="1.8">1.8° (200 ${t.stepsPerTurn})</option>
                        <option value="2.3">2.3° (400 ${t.stepsPerTurn})</option>
                        <option value="0.9">0.9° (400 ${t.stepsPerTurn})</option>
                    </select>
                </div>
            </div>

            <div class="result-area" id="rotation-results">
                <div class="result-item">
                    <span>${t.calculatedRD}:</span>
                    <span class="result-value" id="calc-rd">-</span>
                </div>
                <div class="result-item">
                    <span>${t.rotEstepsEquivalent}:</span>
                    <span class="result-value" id="calc-esteps">-</span>
                </div>
            </div>

            <div id="rot-reference" style="margin-top:0.9rem;"></div>
            <div id="rot-warnings" style="margin-top:0.6rem;"></div>

            <div class="firmware-section">
                <h3><i data-lucide="cpu"></i> ${t.firmwareChanges}</h3>
                <div class="code-group">
                    <label>${t.klipperConfig}</label>
                    <div class="code-block">
                        <code id="klipper-rotation-config">[extruder]\nrotation_distance: 7.71084</code>
                    </div>
                </div>
                <div class="code-group">
                    <label>${t.rotMarlinConfig}</label>
                    <div class="code-block">
                        <code id="marlin-esteps">M92 E415.00</code>
                    </div>
                </div>
            </div>

            <div class="instructions">
                <h3><i data-lucide="info"></i> ${t.instructionsTitle}</h3>
                <p>${t.rotationInstructions}</p>
            </div>
        </div>
    `;

    // Valores de referencia típicos (rotation_distance ↔ E-steps)
    const REFERENCE = [
        { rd: 40.0, esteps: 80, label: '1.8° direct drive' },
        { rd: 7.7108, esteps: 415, label: 'Prusa / 415 steps' },
        { rd: 8.0588, esteps: 794, label: 'Bambu 2.3°' },
        { rd: 7.675, esteps: 417, label: 'Prusa MK4' }
    ];

    function readNum(id, fallback) {
        const el = document.getElementById(id);
        const v = parseFloat(el ? el.value : '');
        return isNaN(v) ? fallback : v;
    }

    function calculate() {
        const mode = document.getElementById('rot-mode').value;
        let rd, esteps, microsteps, stepAngle;

        if (mode === 'esteps') {
            esteps = readNum('steps-per-mm', 0);
            microsteps = readNum('microsteps', 16);
            stepAngle = readNum('step-angle', 1.8);
            if (!esteps || esteps <= 0) return;
            const fullStepsPerRotation = 360 / stepAngle;
            rd = (fullStepsPerRotation * microsteps) / esteps;
        } else {
            rd = readNum('rd-value', 0);
            microsteps = readNum('microsteps-rd', 16);
            stepAngle = readNum('step-angle-rd', 1.8);
            if (!rd || rd <= 0) return;
            const fullStepsPerRotation = 360 / stepAngle;
            esteps = (fullStepsPerRotation * microsteps) / rd;
        }

        document.getElementById('calc-rd').textContent = rd.toFixed(5);
        document.getElementById('calc-esteps').textContent = esteps.toFixed(2) + ' steps/mm';

        const cfg = document.getElementById('klipper-rotation-config');
        if (cfg) cfg.textContent = `[extruder]\nrotation_distance: ${rd.toFixed(5)}`;
        const marlin = document.getElementById('marlin-esteps');
        if (marlin) marlin.textContent = `M92 E${esteps.toFixed(2)}\nM500`;

        // ── comparación con valores de serie ──────────────────────────
        const refBox = document.getElementById('rot-reference');
        if (refBox) {
            const rows = REFERENCE.map(r => {
                const diff = ((rd - r.rd) / r.rd) * 100;
                const near = Math.abs(diff) <= 0.5;
                const color = near ? '#22c55e' : (Math.abs(diff) <= 5 ? '#f59e0b' : 'var(--text-muted)');
                return `<div style="display:flex;justify-content:space-between;gap:0.5rem;font-size:0.78rem;padding:0.25rem 0;border-bottom:1px solid var(--glass-border);">
                    <span style="color:${color};">${near ? '● ' : '○ '}${r.label}</span>
                    <span style="color:var(--text-muted);font-family:var(--font-mono);">${r.rd.toFixed(4)} → ${r.esteps} steps/mm (${diff >= 0 ? '+' : ''}${diff.toFixed(2)} %)</span>
                </div>`;
            }).join('');
            refBox.innerHTML = `<div style="font-size:0.78rem;font-weight:700;margin-bottom:0.3rem;">${t.rotStockRef}</div>` + rows;
        }

        // ── avisos ────────────────────────────────────────────────────
        const warnBox = document.getElementById('rot-warnings');
        if (warnBox) {
            const warns = [];
            if (microsteps === 16) warns.push(t.rotWarnMicro16);
            if (stepAngle === 2.3) warns.push(t.rotWarnMotor23);
            if (rd > 60) warns.push(t.rotWarnRDLarge);
            warnBox.innerHTML = warns.map(w =>
                `<div style="display:flex;gap:0.4rem;align-items:flex-start;font-size:0.78rem;color:var(--text-muted);margin-top:0.35rem;">
                 <span style="color:#f59e0b;">⚠</span><span>${w}</span></div>`).join('');
        }

        if (window.lucide) window.lucide.createIcons();
    }

    ['steps-per-mm', 'microsteps', 'microsteps-rd', 'rd-value'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', calculate);
    });
    ['step-angle', 'step-angle-rd'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', calculate);
    });

    const modeSel = document.getElementById('rot-mode');
    if (modeSel) {
        modeSel.addEventListener('change', () => {
            const isE = modeSel.value === 'esteps';
            document.getElementById('rot-inputs-esteps').style.display = isE ? '' : 'none';
            document.getElementById('rot-inputs-rd').style.display = isE ? 'none' : '';
            calculate();
        });
    }

    // Valores traídos del analizador de logs (si los hay).
    // Si vienen del config, el dato fiable es el rotation_distance.
    if (window.ToolPrefill) {
        const payload = window.ToolPrefill.apply('rotation', {
            'rd-value': 'rd-value',
            'microsteps-rd': 'microsteps',
            'step-angle-rd': 'step-angle',
            'steps-per-mm': 'steps-per-mm',
            'microsteps': 'microsteps',
            'step-angle': 'step-angle'
        });
        if (payload) {
            const useRd = payload['rd-value'] !== undefined && payload['rd-value'] !== null;
            const modeSel = document.getElementById('rot-mode');
            if (modeSel) {
                modeSel.value = useRd ? 'rd' : 'esteps';
                document.getElementById('rot-inputs-esteps').style.display = useRd ? 'none' : '';
                document.getElementById('rot-inputs-rd').style.display = useRd ? '' : 'none';
            }
            ['step-angle', 'step-angle-rd'].forEach(id => {
                const sa = document.getElementById(id);
                if (sa && ['1.8', '2.3', '0.9'].indexOf(sa.value) === -1) sa.value = '2.3';
            });
        }
    }

    calculate();
};
