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
                        <input type="number" id="current-val" value="100" step="0.01">
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
                            <span>${t.newRD}:</span>
                            <span class="result-value" id="new-rd">-</span>
                        </div>
                    </div>
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
                        <code id="klipper-config">[extruder]\nrotation_distance: 33.600</code>
                    </div>
                </div>
            </div>
        </div>
    `;

    const inputs = ['current-val', 'requested-dist', 'mark-dist', 'measured-remaining'];

    function calculate() {
        const currentVal = parseFloat(document.getElementById('current-val').value);
        const requestedDist = parseFloat(document.getElementById('requested-dist').value);
        const markDist = parseFloat(document.getElementById('mark-dist').value);
        const measuredRemaining = parseFloat(document.getElementById('measured-remaining').value);

        if (isNaN(currentVal) || isNaN(requestedDist) || isNaN(markDist) || isNaN(measuredRemaining)) return;

        const actualExtruded = markDist - measuredRemaining;
        const newEsteps = (currentVal * requestedDist) / actualExtruded;
        const newRD = (currentVal * actualExtruded) / requestedDist;

        document.getElementById('actual-extruded').textContent = actualExtruded.toFixed(2) + ' mm';
        document.getElementById('new-esteps').textContent = newEsteps.toFixed(2);
        document.getElementById('new-rd').textContent = newRD.toFixed(4);

        // Update firmware snippets
        document.getElementById('marlin-gcode').textContent = `M92 E${newEsteps.toFixed(2)}\nM500`;
        document.getElementById('marlin-source').textContent = `#define DEFAULT_AXIS_STEPS_PER_UNIT { 80, 80, 4000, ${newEsteps.toFixed(2)} }`;
        document.getElementById('klipper-config').textContent = `[extruder]\nrotation_distance: ${newRD.toFixed(3)}`;

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', calculate);
    });

    calculate();
};
