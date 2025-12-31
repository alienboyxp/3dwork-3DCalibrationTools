window.renderRotation = function (container, t) {
    container.innerHTML = `
        <div class="card">
            <h2><i data-lucide="refresh-cw"></i> ${t.rotation}</h2>
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
                    <option value="1.8">1.8°</option>
                    <option value="0.9">0.9°</option>
                </select>
            </div>
            <div class="result-area" id="rotation-results">
                <div class="result-item">
                    <span>${t.calculatedRD}:</span>
                    <span class="result-value" id="calc-rd">-</span>
                </div>
            </div>

            <div class="firmware-section">
                <h3><i data-lucide="cpu"></i> ${t.firmwareChanges}</h3>
                <div class="code-group">
                    <label>${t.klipperConfig}</label>
                    <div class="code-block">
                        <code id="klipper-rotation-config">[extruder]\nrotation_distance: 33.600</code>
                    </div>
                </div>
            </div>

            <div class="instructions">
                <h3><i data-lucide="info"></i> ${t.instructionsTitle}</h3>
                <p>${t.rotationInstructions}</p>
            </div>
        </div>
    `;

    function calculate() {
        const stepsPerMm = parseFloat(document.getElementById('steps-per-mm').value);
        const microsteps = parseInt(document.getElementById('microsteps').value);
        const stepAngle = parseFloat(document.getElementById('step-angle').value);

        if (isNaN(stepsPerMm) || isNaN(microsteps) || isNaN(stepAngle)) return;

        const fullStepsPerRotation = 360 / stepAngle;
        const rd = (fullStepsPerRotation * microsteps) / stepsPerMm;

        document.getElementById('calc-rd').textContent = rd.toFixed(4);

        const klipperConfigEl = document.getElementById('klipper-rotation-config');
        if (klipperConfigEl) {
            klipperConfigEl.textContent = `[extruder]\nrotation_distance: ${rd.toFixed(3)}`;
        }

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    const inputs = ['steps-per-mm', 'microsteps', 'step-angle'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(id === 'step-angle' ? 'change' : 'input', calculate);
    });

    calculate();
};
