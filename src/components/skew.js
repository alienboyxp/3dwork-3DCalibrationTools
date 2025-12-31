window.renderSkew = function (container, t) {
    // --- Templates for Tables ---
    // t.pos, t.mm, etc are now available
    const createMeasurementRows = (prefix, values) => {
        let html = '';
        values.forEach((val, i) => {
            html += `
                <tr>
                    <td>${prefix.toUpperCase()}${i + 1}</td>
                    <td class="readonly-val" data-desired="${val}">${val}</td>
                    <td><input type="number" class="measure-input" data-group="${prefix}" data-row="${i + 1}" data-col="1" step="0.01"></td>
                    <td><input type="number" class="measure-input" data-group="${prefix}" data-row="${i + 1}" data-col="2" step="0.01"></td>
                    <td><input type="number" class="measure-input" data-group="${prefix}" data-row="${i + 1}" data-col="3" step="0.01"></td>
                    <td class="row-avg" id="avg-${prefix}-${i + 1}">-</td>
                    <td class="row-dev" id="dev-${prefix}-${i + 1}">-</td>
                    <td class="row-status" id="status-${prefix}-${i + 1}">-</td>
                </tr>
            `;
        });
        return html;
    };

    container.innerHTML = `
        <div class="card skew-guide">
            <h2><i data-lucide="box"></i> ${t.skew}</h2>
            
            <!-- Prerequisites -->
            <div class="step-container" style="border-left: 4px solid #f59e0b; background-color: rgba(245, 158, 11, 0.1);">
                 <div class="step-header">
                    <i data-lucide="alert-triangle" style="color: #f59e0b;"></i>
                    <h3 style="margin-left: 10px;">${t.prerequisites}</h3>
                </div>
                <div class="step-content">
                    <p>${t.calibrateEstepsText.replace(t.calibrateEstepsLink, `<a href="./index.html#esteps" onclick="document.querySelector('[data-tool=\\'esteps\\']').click()">${t.calibrateEstepsLink}</a>`)}</p>
                    <p>${t.verifyXY}</p>
                </div>
            </div>

            <!-- Step 1: Print -->
            <div class="step-container">
                <div class="step-header">
                    <span class="step-number">1</span>
                    <h3>${t.step1Print}</h3>
                </div>
                <div class="step-content">
                    <p>${t.skewInstructions}</p>
                    <div class="action-buttons">
                        <a href="https://www.printables.com/model/164261-calibration-bro-calibration-shape-calculator-klipp" target="_blank" class="btn-primary"><i data-lucide="download"></i> ${t.downloadModel}</a>
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="tabs">
                <button class="tab-btn active" data-tab="x-axis">2.a ${t.xAxisCalibration}</button>
                <button class="tab-btn" data-tab="y-axis">2.b ${t.yAxisCalibration}</button>
                <button class="tab-btn" data-tab="skew">2.c ${t.skewCalibration}</button>
            </div>

            <!-- X Axis Tab -->
            <div class="tab-content active" id="x-axis">
                <div class="step-container">
                    <div class="step-header">
                        <span class="step-number">2.a</span>
                        <h3>${t.xAxisCalibration}</h3>
                    </div>
                    
                    <div class="step-content">
                         <div class="cal-image" style="margin-bottom: 2rem; display: block; cursor: pointer;" onclick="window.open('./src/assets/skew-x.png', '_blank')">
                            <img src="./src/assets/skew-x.png" alt="Measure X" class="guide-img" style="max-height: 250px; width: auto; display: block; margin: 0 auto;" title="Click to enlarge">
                         </div>

                         <div class="cal-inputs" style="width: 100%;">
                            <table class="measure-table">
                                <thead>
                                    <tr>
                                        <th>${t.pos}</th>
                                        <th>${t.mm}</th>
                                        <th>${t.try1}</th>
                                        <th>${t.try2}</th>
                                        <th>${t.try3}</th>
                                        <th>${t.average}</th>
                                        <th>${t.deviation}</th>
                                        <th>${t.status}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${createMeasurementRows('x', [110, 60, 30, 45, 85])}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="5" style="text-align:right; font-weight:bold;">${t.total}:</td>
                                        <td id="x-total-avg" class="total-value" style="color: #888;">N/A</td>
                                        <td id="x-total-dev">-</td>
                                        <td id="x-total-status">-</td>
                                    </tr>
                                </tfoot>
                            </table>
                         </div>
                    </div>
                </div>
            </div>

            <!-- Y Axis Tab -->
            <div class="tab-content" id="y-axis">
                <div class="step-container">
                    <div class="step-header">
                        <span class="step-number">2.b</span>
                        <h3>${t.yAxisCalibration}</h3>
                    </div>
                     <div class="step-content">
                         <div class="cal-image" style="margin-bottom: 2rem; display: block; cursor: pointer;" onclick="window.open('./src/assets/skew-y.png', '_blank')">
                            <img src="./src/assets/skew-y.png" alt="Measure Y" class="guide-img" style="max-height: 250px; width: auto; display: block; margin: 0 auto;" title="Click to enlarge">
                         </div>

                         <div class="cal-inputs" style="width: 100%;">
                            <table class="measure-table">
                                <thead>
                                    <tr>
                                        <th>${t.pos}</th>
                                        <th>${t.mm}</th>
                                        <th>${t.try1}</th>
                                        <th>${t.try2}</th>
                                        <th>${t.try3}</th>
                                        <th>${t.average}</th>
                                        <th>${t.deviation}</th>
                                        <th>${t.status}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${createMeasurementRows('y', [110, 60, 30, 45, 85])}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="5" style="text-align:right; font-weight:bold;">${t.total}:</td>
                                        <td id="y-total-avg" class="total-value" style="color: #888;">N/A</td>
                                        <td id="y-total-dev">-</td>
                                        <td id="y-total-status">-</td>
                                    </tr>
                                </tfoot>
                            </table>
                         </div>
                    </div>
                </div>
            </div>

            <!-- Skew Tab -->
            <div class="tab-content" id="skew">
                <div class="step-container">
                    <div class="step-header">
                        <span class="step-number">2.c</span>
                        <h3>${t.skewCalibration}</h3>
                    </div>
                    <div class="step-content">
                        
                        <div class="cal-image" style="margin-bottom: 2rem; display: block; cursor: pointer;" onclick="window.open('./src/assets/skew-diag.png', '_blank')">
                            <img src="./src/assets/skew-diag.png" alt="Measure Skew" class="guide-img" style="max-height: 250px; width: auto; display: block; margin: 0 auto;" title="Click to enlarge">
                         </div>

                        <div class="cal-inputs" style="width: 100%;">

                            <table class="measure-table">
                                 <thead>
                                    <tr>
                                        <th>${t.pos}</th>
                                        <th>${t.mm}</th>
                                        <th>${t.try1}</th>
                                        <th>${t.try2}</th>
                                        <th>${t.try3}</th>
                                        <th>${t.average}</th>
                                        <th>${t.deviation}</th>
                                        <th>${t.status}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Manual creation for specific labels -->
                                    <tr data-prefix="s" data-index="1">
                                        <td>${t.measureHalfCircle}</td>
                                        <td class="readonly-val" data-desired="100.00">100.00</td>
                                        <td><input type="number" class="measure-input" data-group="skew-bd" data-col="1" step="0.01"></td>
                                        <td><input type="number" class="measure-input" data-group="skew-bd" data-col="2" step="0.01"></td>
                                        <td><input type="number" class="measure-input" data-group="skew-bd" data-col="3" step="0.01"></td>
                                        <td id="avg-skew-bd">-</td>
                                        <td id="dev-skew-bd">-</td>
                                        <td id="status-skew-bd">-</td>
                                    </tr>
                                    <tr data-prefix="s" data-index="2">
                                        <td>${t.measureTriangle}</td>
                                        <td class="readonly-val" data-desired="100.00">100.00</td>
                                        <td><input type="number" class="measure-input" data-group="skew-ac" data-col="1" step="0.01"></td>
                                        <td><input type="number" class="measure-input" data-group="skew-ac" data-col="2" step="0.01"></td>
                                        <td><input type="number" class="measure-input" data-group="skew-ac" data-col="3" step="0.01"></td>
                                        <td id="avg-skew-ac">-</td>
                                        <td id="dev-skew-ac">-</td>
                                        <td id="status-skew-ac">-</td>
                                    </tr>
                                    <tr data-prefix="s" data-index="3">
                                        <td>${t.measureQuarterCircle}</td>
                                        <td class="readonly-val" data-desired="70.71">70.71</td>
                                        <td><input type="number" class="measure-input" data-group="skew-ad" data-col="1" step="0.01"></td>
                                        <td><input type="number" class="measure-input" data-group="skew-ad" data-col="2" step="0.01"></td>
                                        <td><input type="number" class="measure-input" data-group="skew-ad" data-col="3" step="0.01"></td>
                                        <td id="avg-skew-ad">-</td>
                                        <td id="dev-skew-ad">-</td>
                                        <td id="status-skew-ad">-</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div id="skew-warning-box" class="info-box info-error" style="display:none; margin-top:1rem;">
                                <i data-lucide="alert-octagon"></i> <span id="skew-warning-text">${t.skewWarning}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

             <div class="firmware-section">
                <h3 style="margin-top: 20px;"><i data-lucide="cpu"></i> ${t.firmwareSectionTitle}</h3>
                
                <!-- Klipper -->
                <div class="step-container" style="border-left: 4px solid var(--primary);">
                    <h4>${t.klipperDocs}</h4>
                    <p style="margin-bottom: 10px;">${t.klipperInstructions}</p>
                    
                    <div class="code-group">
                        <label>${t.klipperCommandNote}</label>
                        <div class="code-block">
                            <code id="klipper-skew-cmd">SET_SKEW XY=...</code>
                            <div class="code-note">SKEW_PROFILE SAVE=my_skew_profile</div>
                            <div class="code-note">SAVE_CONFIG</div>
                        </div>
                    </div>
                </div>

                <!-- Marlin -->
                <div class="step-container" style="border-left: 4px solid var(--secondary);">
                    <h4>${t.marlinDocs}</h4>
                    <p style="margin-bottom: 10px;">${t.marlinInstructions}</p>

                    <!-- Part 1: Steps Calibration -->
                    <div style="margin-bottom: 2rem; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px;">
                        <h5 style="margin-top: 0; color: var(--secondary); margin-bottom: 0.5rem;">${t.marlinStepsCalibration}</h5>
                        <p style="font-size: 0.9em; margin-bottom: 1rem; opacity: 0.8;">${t.marlinStepsInfo}</p>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: end;">
                            <div>
                                <label style="display: block; font-size: 0.8em; margin-bottom: 5px;">${t.currentXSteps}</label>
                                <input type="number" id="x-steps-current" class="params-input" placeholder="e.g. 80.00" step="0.01">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.8em; margin-bottom: 5px; color: var(--accent);">${t.newXSteps}</label>
                                <div id="x-steps-new" style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; font-family: monospace; font-weight: bold;">-</div>
                            </div>
                            
                            <div>
                                <label style="display: block; font-size: 0.8em; margin-bottom: 5px;">${t.currentYSteps}</label>
                                <input type="number" id="y-steps-current" class="params-input" placeholder="e.g. 80.00" step="0.01">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.8em; margin-bottom: 5px; color: var(--accent);">${t.newYSteps}</label>
                                <div id="y-steps-new" style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; font-family: monospace; font-weight: bold;">-</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Part 2: Skew Correction -->
                    <div class="code-group">
                        <label>${t.marlinCommandNote}</label>
                        <div class="code-block">
                           <code id="marlin-skew-defines">#define SKEW_CORRECTION...</code>
                        </div>
                    </div>
                </div>

                <!-- Reprint Recommendation -->
                <div class="step-container" style="border-left: 4px solid #6b7280; background-color: rgba(107, 114, 128, 0.1);">
                     <div class="step-header">
                        <i data-lucide="info" style="color: #6b7280;"></i>
                        <h3 style="margin-left: 10px; color: #6b7280;">INFO</h3>
                    </div>
                    <div class="step-content">
                        <p>${t.skewReprintRecommendation}</p>
                    </div>
                </div>

                <!-- Documentation Links -->
                <div class="step-container">
                    <h3><i data-lucide="book-open"></i> ${t.firmwareDocs}</h3>
                    <div class="action-buttons">
                        <a href="https://www.klipper3d.org/Skew_Correction.html" target="_blank" class="btn-secondary"><i data-lucide="external-link"></i> ${t.klipperDocs}</a>
                        <a href="https://marlinfw.org/docs/gcode/M852.html" target="_blank" class="btn-secondary"><i data-lucide="external-link"></i> ${t.marlinDocs}</a>
                    </div>
                </div>

            </div>

        </div>
    `;

    // --- Tab Switching Logic ---
    const tabs = container.querySelectorAll('.tab-btn');
    const contents = container.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // --- Logic ---

    function calculateStatus(val, desired) {
        if (isNaN(val) || isNaN(desired) || desired === 0) return { dev: 0, status: '-', class: '' };
        const diff = Math.abs(val - desired);
        const percent = (diff / desired) * 100;
        const isOk = percent <= 0.5;
        return {
            dev: percent,
            status: isOk ? 'OK' : 'KO',
            class: isOk ? 'status-ok' : 'status-ko'
        };
    }

    function updateCalculations() {
        // Shared state for deviations
        let xDevPercent = null;
        let yDevPercent = null;

        // Helper for X and Y
        const processAxis = (axis, count) => {
            let sumAvg = 0;
            let sumDesired = 0;
            let validRows = 0;

            for (let i = 1; i <= count; i++) {
                const inputs = Array.from(container.querySelectorAll(`input[data-group="${axis}"][data-row="${i}"]`));
                const rowElement = container.querySelector(`tr:has(input[data-group="${axis}"][data-row="${i}"])`);
                const desired = parseFloat(rowElement?.querySelector('.readonly-val')?.dataset.desired || 0);

                const vals = inputs.map(inp => parseFloat(inp.value)).filter(v => !isNaN(v));

                if (vals.length > 0) {
                    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                    document.getElementById(`avg-${axis}-${i}`).textContent = avg.toFixed(3);

                    const stat = calculateStatus(avg, desired);
                    const devEl = document.getElementById(`dev-${axis}-${i}`);
                    const statusEl = document.getElementById(`status-${axis}-${i}`);

                    devEl.textContent = stat.dev.toFixed(2) + '%';
                    statusEl.textContent = stat.status;
                    statusEl.className = 'row-status ' + stat.class;

                    sumAvg += avg;
                    sumDesired += desired;
                    validRows++;
                } else {
                    document.getElementById(`avg-${axis}-${i}`).textContent = '-';
                    document.getElementById(`dev-${axis}-${i}`).textContent = '-';
                    document.getElementById(`status-${axis}-${i}`).textContent = '-';
                    document.getElementById(`status-${axis}-${i}`).className = 'row-status';
                }
            }

            // Total Row
            // const totalAvgEl = document.getElementById(`${axis}-total-avg`); // Removed
            const totalDevEl = document.getElementById(`${axis}-total-dev`);
            const totalStatusEl = document.getElementById(`${axis}-total-status`);

            if (validRows > 0) {
                // totalAvgEl.textContent = sumAvg.toFixed(3); // Removed

                // Calculate Total Deviation
                // Deviation is based on Total Avg vs Total Desired? No, standard practice is average of deviations OR total vs total.
                // Previous code: calculateStatus(sumAvg, sumDesired).
                // If sumAvg > sumDesired, it means printer is over-extruding/moving too far.
                // Status dev % = ((sumAvg - sumDesired)/sumDesired)*100.

                const totalStat = calculateStatus(sumAvg, sumDesired);

                // Store regular deviation (not absolute) for steps calculation
                // calculateStatus returns absolute deviation percent. We need signed deviation.
                const signedDiff = sumAvg - sumDesired;
                const signedPercent = (signedDiff / sumDesired); // decimal (e.g. 0.01 for 1%)

                if (axis === 'x') xDevPercent = signedPercent;
                if (axis === 'y') yDevPercent = signedPercent;

                totalDevEl.textContent = totalStat.dev.toFixed(2) + '%';
                totalStatusEl.textContent = totalStat.status;
                totalStatusEl.className = totalStat.class;
            } else {
                // totalAvgEl.textContent = '-';
                totalDevEl.textContent = '-';
                totalStatusEl.textContent = '-';
                totalStatusEl.className = '';
            }
        };

        processAxis('x', 5);
        processAxis('y', 5);

        // Process Skew (2.c)
        const skewGroups = ['skew-bd', 'skew-ac', 'skew-ad'];
        const means = {};

        skewGroups.forEach(group => {
            const inputs = Array.from(container.querySelectorAll(`input[data-group="${group}"]`));
            const vals = inputs.map(inp => parseFloat(inp.value)).filter(v => !isNaN(v));

            const firstInput = inputs[0];
            const row = firstInput?.closest('tr');
            const desired = parseFloat(row?.querySelector('.readonly-val')?.dataset.desired || 0);

            if (vals.length > 0) {
                const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                row.querySelector(`[id^="avg-${group}"]`).textContent = avg.toFixed(3);

                const stat = calculateStatus(avg, desired);
                const devEl = row.querySelector(`[id^="dev-${group}"]`);
                const statEl = row.querySelector(`[id^="status-${group}"]`);

                devEl.textContent = stat.dev.toFixed(2) + '%';
                statEl.textContent = stat.status;
                statEl.className = 'row-status ' + stat.class;

                if (group === 'skew-bd') means.bd = avg;
                if (group === 'skew-ac') means.ac = avg;
                if (group === 'skew-ad') means.ad = avg;

            } else {
                row.querySelector(`[id^="avg-${group}"]`).textContent = '-';
                row.querySelector(`[id^="dev-${group}"]`).textContent = '-';
                row.querySelector(`[id^="status-${group}"]`).textContent = '-';
                row.querySelector(`[id^="status-${group}"]`).className = 'row-status';
            }
        });

        // Update Firmware Blocks
        // Always assuming XY for now as Plane selector is removed
        if (means.ac && means.bd && means.ad) {
            updateFirmwareValues(means.ac, means.bd, means.ad);
        } else {
            // Clear firmware values if not all skew measurements are available
            document.getElementById('klipper-skew-cmd').textContent = `SET_SKEW XY=...`;
            document.getElementById('marlin-skew-defines').textContent = `#define SKEW_CORRECTION...`;
            document.getElementById('skew-warning-box').style.display = 'none';
        }

        // Update Steps Calculation
        if (xDevPercent !== null) {
            const curX = parseFloat(document.getElementById('x-steps-current').value);
            if (!isNaN(curX)) {
                // New = Current / (1 + deviation_decimal)
                // If Measured 101, Expected 100, Dev = +0.01. New = 80 / 1.01 = 79.2
                const newX = curX / (1 + xDevPercent);
                document.getElementById('x-steps-new').textContent = newX.toFixed(2);
            } else {
                document.getElementById('x-steps-new').textContent = '-';
            }
        }
        if (yDevPercent !== null) {
            const curY = parseFloat(document.getElementById('y-steps-current').value);
            if (!isNaN(curY)) {
                const newY = curY / (1 + yDevPercent);
                document.getElementById('y-steps-new').textContent = newY.toFixed(2);
            } else {
                document.getElementById('y-steps-new').textContent = '-';
            }
        }
    }

    function updateFirmwareValues(ac, bd, ad) {
        // Default to XY
        const plane = 'XY';

        // Klipper
        const klipperCmd = `SET_SKEW ${plane}=${ac.toFixed(3)},${bd.toFixed(3)},${ad.toFixed(3)}`;
        document.getElementById('klipper-skew-cmd').textContent = klipperCmd + "\nSKEW_PROFILE SAVE=my_skew_profile\nSAVE_CONFIG";

        // Marlin
        let marlinText = `#define SKEW_CORRECTION\n`;
        marlinText += `#define ${plane}_DIAG_AC ${ac.toFixed(3)}\n`;
        marlinText += `#define ${plane}_DIAG_BD ${bd.toFixed(3)}\n`;
        marlinText += `#define ${plane}_SIDE_AD ${ad.toFixed(3)}`;

        document.getElementById('marlin-skew-defines').textContent = marlinText;

        try {
            const cosD = (bd * bd - ac * ac) / (4 * ad * ad);
            const clampedCosD = Math.max(-1, Math.min(1, cosD));
            const angleRad = Math.acos(clampedCosD);
            const angleDeg = angleRad * (180 / Math.PI);
            const error = Math.abs(90 - angleDeg);

            const warningBox = document.getElementById('skew-warning-box');
            if (error > 0.5) {
                warningBox.style.display = 'block';
                document.getElementById('skew-warning-text').textContent = `${t.skewWarning} (Error: ${error.toFixed(2)}°)`;
            } else {
                warningBox.style.display = 'none';
            }
        } catch (e) { console.error(e); }
    }

    // Event Listeners
    container.addEventListener('input', (e) => {
        if (e.target.matches('input.measure-input') || e.target.matches('input.params-input')) {
            updateCalculations();
        }
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Initial call (although empty)
    updateCalculations();
};
