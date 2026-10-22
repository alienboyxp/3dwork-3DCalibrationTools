window.renderVref = function (container, t) {
    // ── Tabla de drivers ────────────────────────────────────────────────
    // vrefMax: Vref máximo del driver (V) | iPeak: corriente pico (A)
    // rms: factor para pasar de pico a RMS | sense: usa resistencia externa
    const DRIVERS = {
        tmc2130: { name: 'TMC2130', vrefMax: 0.5, iPeak: 1.2, rms: 0.707, sense: true },
        tmc2208: { name: 'TMC2208', vrefMax: 0.5, iPeak: 2.0, rms: 0.707, sense: true },
        tmc2209: { name: 'TMC2209', vrefMax: 0.5, iPeak: 2.0, rms: 0.707, sense: true },
        tmc2225: { name: 'TMC2225', vrefMax: 0.5, iPeak: 2.0, rms: 0.707, sense: true, standaloneMax: 1.2 },
        tmc2226: { name: 'TMC2226', vrefMax: 0.5, iPeak: 2.0, rms: 0.707, sense: true, standaloneMax: 1.2 },
        tmc2240: { name: 'TMC2240', vrefMax: 0.5, iPeak: 12.0, rms: 0.707, sense: false },
        tmc2660: { name: 'TMC2660', vrefMax: 0.5, iPeak: 3.5, rms: 0.707, sense: true },
        tmc5160: { name: 'TMC5160', vrefMax: 0.5, iPeak: 20.0, rms: 0.707, sense: true },
        a4988: { name: 'A4988 (Pololu)', vrefMax: 0.5, iPeak: 2.0, rms: 0.707, sense: true },
        drv8825: { name: 'DRV8825', vrefMax: 1.0, iPeak: 2.2, rms: 0.707, sense: true, halfRef: true }
    };

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2><i data-lucide="zap"></i> ${t.vrefTitle}</h2>
                <p style="margin-bottom: 0.5rem;">${t.vrefSummary}</p>
                <div class="info-box" style="text-align: left; background: rgba(255,255,255,0.03); padding: 0.75rem 1rem; border-radius: 12px; font-size: 0.85rem; line-height: 1.5; color: var(--text-muted); border-left: 3px solid var(--primary);">
                    ${t.vrefInstructions}
                </div>
            </div>

            <div class="calculator-grid vref-layout">
                <!-- ROW 1: INPUTS (Full Width) -->
                <div class="input-section grid-span-all">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>${t.driverType}</label>
                            <select id="driver-type">
                                <option value="tmc2209">TMC2209</option>
                                <option value="tmc2208">TMC2208</option>
                                <option value="tmc2226">TMC2226</option>
                                <option value="tmc2225">TMC2225</option>
                                <option value="tmc2130">TMC2130</option>
                                <option value="tmc2240">TMC2240</option>
                                <option value="tmc2660">TMC2660</option>
                                <option value="tmc5160">TMC5160</option>
                                <option value="a4988">A4988 (Pololu)</option>
                                <option value="drv8825">DRV8825</option>
                            </select>
                        </div>

                        <div class="form-group" style="margin-bottom: 0;">
                            <label>${t.ratedCurrent}</label>
                            <input type="number" id="motor-current" value="1.5" step="0.1" min="0">
                        </div>

                        <div class="form-group" style="margin-bottom: 0;">
                            <label>${t.safetyMargin}</label>
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <input type="range" id="safety-margin" value="85" min="50" max="100" style="flex: 1;">
                                <span id="margin-value" style="min-width: 3rem;">85%</span>
                            </div>
                        </div>

                        <div id="rs-group" class="form-group" style="margin-bottom: 0;">
                            <label>${t.senseResistor}</label>
                            <select id="sense-resistor">
                                <option value="0.11">0.110 Ω (R110)</option>
                                <option value="0.075">0.075 Ω (R075)</option>
                                <option value="0.1">0.100 Ω (R100)</option>
                                <option value="0.05">0.050 Ω (R050)</option>
                                <option value="0.2">0.200 Ω (R200)</option>
                                <option value="0.025">0.025 Ω (R025)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- ROW 2 - COL 1: STANDALONE MODE -->
                <div class="result-section" id="standalone-section">
                    <h3 style="margin-bottom: 1rem; color: var(--primary-light); font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="settings" style="width: 18px; height: 18px;"></i> ${t.vrefStandaloneMode}
                    </h3>
                    <div class="results-display">
                        <div class="result-item highlight">
                            <span class="label">${t.peakCurrent}</span>
                            <span class="value" id="imax-result">0.00 A</span>
                        </div>
                        <div class="result-item">
                            <span class="label">${t.vrefResult}</span>
                            <span class="value" id="vref-result">0.00 V</span>
                        </div>
                        <div class="result-item">
                            <span class="label">${t.rmsResult}</span>
                            <span class="value" id="rms-result">0.00 A</span>
                        </div>
                        <div class="result-item">
                            <span class="label">${t.vrefStandaloneCurrent}</span>
                            <span class="value" id="standalone-result">0.00 A</span>
                        </div>
                    </div>
                    <div id="vref-warnings" style="margin-top: 0.9rem;"></div>
                </div>

                <!-- ROW 2 - COL 2: INTELLIGENT MODE -->
                <div class="result-section" id="intelligent-mode-wrapper">
                    <h3 style="margin-bottom: 1rem; color: var(--secondary); font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="cpu" style="width: 18px; height: 18px;"></i> ${t.vrefIntelligentMode}
                    </h3>
                    <div class="info-box" style="margin-bottom: 1rem; font-size: 0.85rem; padding: 0.75rem;">
                        <p>${t.vrefTMCConfigNote}</p>
                    </div>

                    <div class="config-tabs">
                        <div style="margin-bottom: 1rem;">
                            <label style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.4rem; display: block;">${t.vrefMarlinGcode}</label>
                            <pre id="marlin-config" class="config-code">M906 X1275 ; Set mA</pre>
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.4rem; display: block;">${t.vrefKlipperConfig}</label>
                            <pre id="klipper-config" class="config-code">run_current: 0.902</pre>
                        </div>
                    </div>
                    <div id="vref-driver-note" style="margin-top:1rem;font-size:0.8rem;color:var(--text-muted);"></div>
                </div>

                <!-- ROW 3: TABLA DE DRIVERS -->
                <div class="grid-span-all" style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--glass-border);">
                    <h4 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.6rem; font-size: 1rem;">
                        <i data-lucide="table" style="width: 20px; height: 20px; color: var(--primary-light);"></i> ${t.vrefDriverTable}
                    </h4>
                    <div style="overflow-x:auto;">
                        <table id="vref-table" style="width:100%;border-collapse:collapse;font-size:0.8rem;">
                            <thead>
                                <tr style="text-align:left;border-bottom:1px solid var(--glass-border);">
                                    <th style="padding:0.4rem 0.5rem;">${t.driverType}</th>
                                    <th style="padding:0.4rem 0.5rem;">${t.vrefMaxVref}</th>
                                    <th style="padding:0.4rem 0.5rem;">${t.vrefMaxCurrent}</th>
                                    <th style="padding:0.4rem 0.5rem;">${t.vrefStandalone}</th>
                                </tr>
                            </thead>
                            <tbody id="vref-table-body"></tbody>
                        </table>
                    </div>
                </div>

                <!-- ROW 4: DOCUMENTATION (Full Width) -->
                <div class="vref-docs grid-span-all" style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--glass-border);">
                    <h4 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.6rem; font-size: 1rem;">
                        <i data-lucide="book-open" style="width: 20px; height: 20px; color: var(--primary-light);"></i> ${t.firmwareDocs}
                    </h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <a href="https://marlinfw.org/docs/gcode/M906.html" target="_blank" class="doc-link">
                            <i data-lucide="external-link"></i> ${t.vrefMarlinDocs}
                        </a>
                        <a href="https://www.klipper3d.org/Config_Reference.html#tmc-stepper-driver-configuration" target="_blank" class="doc-link">
                            <i data-lucide="external-link"></i> ${t.vrefKlipperDocs}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;

    const driverType = document.getElementById('driver-type');
    const motorCurrent = document.getElementById('motor-current');
    const safetyMargin = document.getElementById('safety-margin');
    const marginValue = document.getElementById('margin-value');
    const rsGroup = document.getElementById('rs-group');
    const senseResistor = document.getElementById('sense-resistor');
    const standaloneSection = document.getElementById('standalone-section');
    const intelligentWrapper = document.getElementById('intelligent-mode-wrapper');

    const imaxRes = document.getElementById('imax-result');
    const vrefRes = document.getElementById('vref-result');
    const rmsRes = document.getElementById('rms-result');
    const standaloneRes = document.getElementById('standalone-result');
    const marlinConfig = document.getElementById('marlin-config');
    const klipperConfig = document.getElementById('klipper-config');
    const warnBox = document.getElementById('vref-warnings');
    const driverNote = document.getElementById('vref-driver-note');

    // Tabla de drivers
    const tableBody = document.getElementById('vref-table-body');
    if (tableBody) {
        tableBody.innerHTML = Object.keys(DRIVERS).map(k => {
            const d = DRIVERS[k];
            const standalone = d.standaloneMax ? d.standaloneMax.toFixed(2) + ' A RMS' :
                (d.sense ? '0.9 V → ' + (0.9 / (8 * 0.11) * 0.707).toFixed(2) + ' A RMS' : '—');
            return `<tr style="border-bottom:1px solid var(--glass-border);" data-driver="${k}">
                <td style="padding:0.35rem 0.5rem;font-weight:600;">${d.name}</td>
                <td style="padding:0.35rem 0.5rem;font-family:var(--font-mono);">${d.vrefMax.toFixed(2)} V</td>
                <td style="padding:0.35rem 0.5rem;font-family:var(--font-mono);">${d.iPeak.toFixed(1)} A pico</td>
                <td style="padding:0.35rem 0.5rem;font-family:var(--font-mono);">${standalone}</td>
            </tr>`;
        }).join('');
    }

    function calculate() {
        const iRated = parseFloat(motorCurrent.value) || 0;
        const margin = parseFloat(safetyMargin.value) / 100;
        const iMax = iRated * margin;

        const key = driverType.value;
        const d = DRIVERS[key] || DRIVERS.tmc2209;
        const rs = parseFloat(senseResistor.value) || 0.11;

        let vref = 0;
        let rms = iMax * d.rms;
        let standaloneCurrent = 0;

        if (key === 'a4988') {
            // Vref = I_pico × 8 × Rsense
            vref = iMax * 8 * rs;
            standaloneCurrent = (vref / (8 * rs)) * d.rms;
            rsGroup.style.display = 'block';
            intelligentWrapper.style.display = 'none';
            standaloneSection.classList.add('grid-span-all');
        } else if (key === 'drv8825') {
            // Vref = I_pico / 2
            vref = iMax / 2;
            standaloneCurrent = (vref * 2) * d.rms;
            rsGroup.style.display = 'none';
            intelligentWrapper.style.display = 'none';
            standaloneSection.classList.add('grid-span-all');
        } else {
            // TMC: en modo digital la corriente la fija run_current (RMS).
            // En modo standalone la fija el Vref: I_pico = Vref / (8 × Rsense)
            vref = iMax * 8 * rs;
            standaloneCurrent = (vref / (8 * rs)) * d.rms;
            rsGroup.style.display = d.sense ? 'block' : 'none';
            intelligentWrapper.style.display = 'block';
            standaloneSection.classList.remove('grid-span-all');

            const ma = Math.round(iMax * 1000);
            marlinConfig.textContent = `M906 X${ma} ; Set current for X to ${ma}mA`;
            klipperConfig.textContent = `run_current: ${rms.toFixed(3)}`;
        }

        imaxRes.textContent = iMax.toFixed(3) + ' A';
        vrefRes.textContent = vref.toFixed(3) + ' V';
        rmsRes.textContent = rms.toFixed(3) + ' A';
        standaloneRes.textContent = standaloneCurrent.toFixed(2) + ' A RMS';
        marginValue.textContent = safetyMargin.value + '%';

        // ── avisos ────────────────────────────────────────────────────
        if (warnBox) {
            const warns = [];
            if (vref > d.vrefMax) {
                warns.push(`<span style="color:#f43f5e;">⚠</span><span>${t.vrefWarnMaxVref.replace('{max}', d.vrefMax.toFixed(2))}</span>`);
            }
            if (iMax > d.iPeak) {
                warns.push(`<span style="color:#f43f5e;">⚠</span><span>${t.vrefWarnMaxCurrent.replace('{max}', d.iPeak.toFixed(1))}</span>`);
            }
            if (d.standaloneMax && standaloneCurrent > d.standaloneMax) {
                warns.push(`<span style="color:#f59e0b;">⚠</span><span>${t.vrefWarnStandalone.replace('{max}', d.standaloneMax.toFixed(2))}</span>`);
            }
            if (key.startsWith('tmc') && d.sense) {
                warns.push(`<span style="color:var(--text-muted);">ℹ</span><span>${t.vrefWarnUart}</span>`);
            }
            warnBox.innerHTML = warns.map(w =>
                `<div style="display:flex;gap:0.4rem;align-items:flex-start;font-size:0.78rem;color:var(--text-muted);margin-top:0.35rem;">${w}</div>`).join('');
        }

        if (driverNote) {
            driverNote.innerHTML = `<strong>${d.name}</strong> — ${t.vrefDriverNote}`;
        }

        // resalta la fila del driver seleccionado en la tabla
        if (tableBody) {
            tableBody.querySelectorAll('tr').forEach(tr => {
                const on = tr.getAttribute('data-driver') === key;
                tr.style.background = on ? 'rgba(34,197,94,0.10)' : '';
                tr.style.fontWeight = on ? '600' : '';
            });
        }

        if (window.lucide) window.lucide.createIcons();
    }

    [driverType, senseResistor].forEach(el => {
        el.addEventListener('change', calculate);
    });

    [motorCurrent, safetyMargin].forEach(el => {
        el.addEventListener('input', calculate);
    });

    // Valores traídos del analizador de logs (si los hay)
    if (window.ToolPrefill) {
        window.ToolPrefill.apply('vref', {
            'driver-type': 'driver-type',
            'sense-resistor': 'sense-resistor'
        });
        // El log puede traer "TMC2209" mientras el select usa "tmc2209"
        const dt = document.getElementById('driver-type');
        if (dt && dt.value !== driverType.value) {
            const wanted = String(dt.value || '').toLowerCase();
            const opt = Array.from(dt.options).find(o => o.value === wanted);
            if (opt) driverType.value = wanted;
        }
    }

    calculate();

    if (window.lucide) {
        window.lucide.createIcons();
    }
};
