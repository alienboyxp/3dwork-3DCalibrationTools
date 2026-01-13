window.renderVref = function (container, t) {
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
                                <option value="tmc">TMC2208 / TMC2209 / TMC2225 / TMC2226</option>
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

                        <div id="rs-group" class="form-group" style="display: none; margin-bottom: 0;">
                            <label>${t.senseResistor}</label>
                            <select id="sense-resistor">
                                <option value="0.1">0.100 Ω (R100 - Green/Most common)</option>
                                <option value="0.05">0.050 Ω (R050 - Original Pololu)</option>
                                <option value="0.2">0.200 Ω (R200 - Red/StepStick)</option>
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
                    </div>
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
                </div>

                <!-- ROW 3: DOCUMENTATION (Full Width) -->
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
    const marlinConfig = document.getElementById('marlin-config');
    const klipperConfig = document.getElementById('klipper-config');

    function calculate() {
        const iRated = parseFloat(motorCurrent.value) || 0;
        const margin = parseFloat(safetyMargin.value) / 100;
        const iMax = iRated * margin;

        let vref = 0;
        let rms = iMax / 1.414;

        const type = driverType.value;
        if (type === 'a4988') {
            const rs = parseFloat(senseResistor.value);
            vref = iMax * 8 * rs;
            rsGroup.style.display = 'block';
            intelligentWrapper.style.display = 'none';
            standaloneSection.classList.add('grid-span-all');
        } else if (type === 'drv8825') {
            vref = iMax / 2;
            rsGroup.style.display = 'none';
            intelligentWrapper.style.display = 'none';
            standaloneSection.classList.add('grid-span-all');
        } else { // TMC
            vref = iMax; // Standalone estimate
            rsGroup.style.display = 'none';
            intelligentWrapper.style.display = 'block';
            standaloneSection.classList.remove('grid-span-all');

            // Update intelligent config
            const ma = Math.round(iMax * 1000);
            marlinConfig.textContent = `M906 X${ma} ; Set current for X to ${ma}mA`;
            klipperConfig.textContent = `run_current: ${rms.toFixed(3)}`;
        }

        imaxRes.textContent = iMax.toFixed(3) + ' A';
        vrefRes.textContent = vref.toFixed(3) + ' V';
        rmsRes.textContent = rms.toFixed(3) + ' A';
        marginValue.textContent = safetyMargin.value + '%';
    }

    [driverType, senseResistor].forEach(el => {
        el.addEventListener('change', calculate);
    });

    [motorCurrent, safetyMargin].forEach(el => {
        el.addEventListener('input', calculate);
    });

    calculate();

    if (window.lucide) {
        window.lucide.createIcons();
    }
};
