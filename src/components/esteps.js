window.renderEsteps = function (container, t) {
    container.innerHTML = `
        <div class="card esteps-guide">
            <h2><i data-lucide="gauge"></i> ${t.esteps}</h2>

            <div class="step-container">
                <div class="step-header">
                    <span class="step-number">0</span>
                    <h3>${t.step0Title}</h3>
                </div>
                <div class="step-content">
                    <div class="gcode-instructions">
                        <div class="gcode-item">
                            <p>${t.step0Marlin}</p>
                        </div>
                        <div class="gcode-item">
                            <p>${t.step0Klipper}</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>${t.currentEsteps}</label>
                        <input type="number" id="current-val" value="100" step="0.01">
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
                        <div class="form-group">
                            <label>${t.motorType}</label>
                            <select id="motor-type">
                                <option value="1.8">${t.motor18} (200 ${t.stepsPerTurn})</option>
                                <option value="2.3">${t.motor23} (400 ${t.stepsPerTurn})</option>
                                <option value="custom">${t.motorCustom}</option>
                            </select>
                        </div>
                        <div class="form-group" id="custom-steps-wrap" style="display:none;">
                            <label>${t.stepsPerTurn}</label>
                            <input type="number" id="steps-per-rev" value="200" step="1">
                        </div>
                        <div class="form-group">
                            <label>${t.microsteps}</label>
                            <select id="microsteps-select">
                                <option value="16">16</option>
                                <option value="32">32</option>
                                <option value="8">8</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="step-container">
                <div class="step-header">
                    <span class="step-number">1</span>
                    <h3>${t.step1Title}</h3>
                </div>
                <div class="step-content">
                    <p>${t.step1Desc}</p>
                    <img src="https://teachingtechyt.github.io/img/mark.jpg" alt="Step 1" class="step-img">
                    <div class="form-group">
                        <label>${t.markDist}</label>
                        <input type="number" id="mark-dist" value="120" step="0.1">
                    </div>
                </div>
            </div>

            <div class="step-container">
                <div class="step-header">
                    <span class="step-number">2</span>
                    <h3>${t.step2Title}</h3>
                </div>
                <div class="step-content">
                    <p>${t.step2Desc}</p>
                    <div class="gcode-instructions">
                        <div class="gcode-item">
                            <label>${t.extrudeMarlin}</label>
                            <code>G1 E100 F60</code>
                        </div>
                        <div class="gcode-item">
                            <label>${t.extrudeKlipper}</label>
                            <code>G1 E100 F60</code>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>${t.requestedDist}</label>
                        <input type="number" id="requested-dist" value="100" step="0.1">
                    </div>
                </div>
            </div>

            <div class="step-container">
                <div class="step-header">
                    <span class="step-number">3</span>
                    <h3>${t.step3Title}</h3>
                </div>
                <div class="step-content">
                    <p>${t.step3Desc}</p>
                    <img src="https://teachingtechyt.github.io/img/mark2.jpg" alt="Step 3" class="step-img">
                    <div class="form-group">
                        <label>${t.measuredDist}</label>
                        <input type="number" id="measured-remaining" value="20" step="0.1">
                    </div>
                </div>
            </div>

            <div class="step-container">
                <div class="step-header">
                    <span class="step-number">4</span>
                    <h3>${t.step4Title}</h3>
                </div>
                <div class="step-content">
                    <p>${t.step4Desc}</p>
                    <div class="result-area" id="esteps-results">
                        <div class="result-item">
                            <span>${t.actualExtruded}:</span>
                            <span class="result-value" id="actual-extruded">-</span>
                        </div>
                        <div class="result-item">
                            <span>${t.newEsteps}:</span>
                            <span class="result-value" id="new-esteps">-</span>
                        </div>
                        <div class="result-item">
                            <span>${t.currentRD}:</span>
                            <span class="result-value" id="current-rd">-</span>
                        </div>
                        <div class="result-item">
                            <span>${t.newRD}:</span>
                            <span class="result-value" id="new-rd">-</span>
                        </div>
                        <div class="result-item">
                            <span>${t.deviation}:</span>
                            <span class="result-value" id="esteps-deviation">-</span>
                        </div>
                    </div>
                    <div id="esteps-verdict" style="margin-top:0.75rem;"></div>
                    <div id="esteps-warnings" style="margin-top:0.6rem;"></div>
                </div>
            </div>

            <div class="firmware-section">
                <h3><i data-lucide="cpu"></i> ${t.firmwareChanges}</h3>
                <div class="code-group">
                    <label>${t.marlinGcode}</label>
                    <div class="code-block">
                        <code id="marlin-gcode">M92 E100.00\nM500</code>
                        <div class="code-note">${t.saveEeprom}</div>
                    </div>
                </div>
                <div class="code-group">
                    <label>${t.marlinSource}</label>
                    <div class="code-block">
                        <code id="marlin-source">#define DEFAULT_AXIS_STEPS_PER_UNIT { 80, 80, 4000, 100.00 }</code>
                        <div class="code-note">${t.dummyValuesNote}</div>
                    </div>
                </div>
                <div class="code-group">
                    <label>${t.klipperConfig}</label>
                    <div class="code-block">
                        <code id="klipper-config">[extruder]\nrotation_distance: 32.00000</code>
                    </div>
                </div>
            </div>
        </div>
    `;

    const inputs = ['current-val', 'requested-dist', 'mark-dist', 'measured-remaining'];

    // ── datos del motor ────────────────────────────────────────────────
    function stepsPerRev() {
        const sel = document.getElementById('motor-type').value;
        if (sel === '1.8') return 200;
        if (sel === '2.3') return 400;
        const v = parseInt(document.getElementById('steps-per-rev').value, 10);
        return isNaN(v) || v <= 0 ? 200 : v;
    }

    function microsteps() {
        const v = parseInt(document.getElementById('microsteps-select').value, 10);
        return isNaN(v) || v <= 0 ? 16 : v;
    }

    function calculate() {
        const currentVal = parseFloat(document.getElementById('current-val').value);
        const requestedDist = parseFloat(document.getElementById('requested-dist').value);
        const markDist = parseFloat(document.getElementById('mark-dist').value);
        const measuredRemaining = parseFloat(document.getElementById('measured-remaining').value);

        if (isNaN(currentVal) || isNaN(requestedDist) || isNaN(markDist) || isNaN(measuredRemaining)) return;

        const actualExtruded = markDist - measuredRemaining;
        const verdictBox = document.getElementById('esteps-verdict');
        const warnBox = document.getElementById('esteps-warnings');

        // ──guards ────────────────────────────────────────────────────
        if (currentVal <= 0 || requestedDist <= 0) {
            if (verdictBox) verdictBox.innerHTML = `<div style="color:#f43f5e;font-size:0.85rem;">${t.estepsInvalid}</div>`;
            return;
        }
        if (actualExtruded <= 0) {
            if (verdictBox) verdictBox.innerHTML = `<div style="color:#f43f5e;font-size:0.85rem;">${t.estepsNoExtrusion}</div>`;
            return;
        }

        // E-steps = pasos_por_vuelta × microsteps / rotation_distance
        const spr = stepsPerRev();
        const ms = microsteps();
        const currentRD = (spr * ms) / currentVal;
        const newEsteps = (currentVal * requestedDist) / actualExtruded;
        const newRD = currentRD * (actualExtruded / requestedDist);
        const deviationPct = ((actualExtruded / requestedDist) - 1) * 100;

        document.getElementById('actual-extruded').textContent = actualExtruded.toFixed(2) + ' mm';
        document.getElementById('new-esteps').textContent = newEsteps.toFixed(2);
        document.getElementById('current-rd').textContent = currentRD.toFixed(5);
        document.getElementById('new-rd').textContent = newRD.toFixed(5);
        document.getElementById('esteps-deviation').textContent =
            (deviationPct >= 0 ? '+' : '') + deviationPct.toFixed(2) + ' %';

        // ── veredicto ────────────────────────────────────────────────
        if (verdictBox) {
            const abs = Math.abs(deviationPct);
            let color, icon, text;
            if (abs <= 1) {
                color = '#22c55e'; icon = '✓';
                text = t.estepsVerdictOk;
            } else if (abs <= 3) {
                color = '#f59e0b'; icon = '~';
                text = t.estepsVerdictClose;
            } else {
                color = '#f43f5e'; icon = '✗';
                text = t.estepsVerdictBad;
            }
            verdictBox.innerHTML = `<div style="display:flex;gap:0.5rem;align-items:flex-start;padding:0.6rem 0.75rem;border-radius:8px;border:1px solid ${color}44;background:${color}14;font-size:0.85rem;">
                <span style="color:${color};font-weight:700;">${icon}</span>
                <span>${text}</span></div>`;
        }

        // ── avisos ───────────────────────────────────────────────────
        if (warnBox) {
            const warns = [];
            if (actualExtruded < 20) {
                warns.push(t.estepsWarnShort);
            }
            if (ms === 16) {
                warns.push(t.estepsWarnMicro16);
            }
            if (document.getElementById('motor-type').value === '2.3') {
                warns.push(t.estepsWarnMotor23);
            }
            if (currentRD > 100) {
                warns.push(t.estepsWarnRD);
            }
            warnBox.innerHTML = warns.map(w =>
                `<div style="display:flex;gap:0.4rem;align-items:flex-start;font-size:0.78rem;color:var(--text-muted);margin-top:0.35rem;">
                 <span style="color:#f59e0b;">⚠</span><span>${w}</span></div>`).join('');
        }

        // Update firmware snippets
        document.getElementById('marlin-gcode').textContent = `M92 E${newEsteps.toFixed(2)}\nM500`;
        document.getElementById('marlin-source').textContent = `#define DEFAULT_AXIS_STEPS_PER_UNIT { 80, 80, 4000, ${newEsteps.toFixed(2)} }`;
        document.getElementById('klipper-config').textContent = `[extruder]\nrotation_distance: ${newRD.toFixed(5)}`;

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', calculate);
    });

    ['motor-type', 'microsteps-select', 'steps-per-rev'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => {
            const wrap = document.getElementById('custom-steps-wrap');
            if (wrap) {
                wrap.style.display = document.getElementById('motor-type').value === 'custom' ? '' : 'none';
            }
            calculate();
        });
    });

    // Valores traídos del analizador de logs (si los hay)
    if (window.ToolPrefill) {
        window.ToolPrefill.apply('esteps', {
            'current-val': 'current-val',
            'microsteps-select': 'microsteps',
            'motor-type': 'motor-type'
        });
        const mt = document.getElementById('motor-type');
        if (mt) mt.dispatchEvent(new Event('change'));
    }

    calculate();
};
