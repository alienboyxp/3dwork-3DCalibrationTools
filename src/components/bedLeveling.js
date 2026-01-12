window.renderBedLeveling = function (container, t) {
    container.innerHTML = `
        <div class="card">
            <h2><i data-lucide="wrench"></i> ${t.manualLevelingTitle}</h2>
            
            <!-- How It Works -->
            <div class="info-box" style="flex-direction: column; align-items: flex-start; margin-bottom: 1rem; background: rgba(255,255,255,0.03);">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <i data-lucide="info" style="color: var(--primary-light);"></i>
                    <h4 style="margin:0;">${t.howItWorks}</h4>
                </div>
                <p style="margin:0; font-size: 0.9em; opacity: 0.8;">${t.bedLevelingHowTo}</p>
                <ol style="margin: 0.5rem 0 0 1.2rem; font-size: 0.9em; opacity: 0.8; line-height: 1.6;">
                    <li>${t.bedLevelingStep1}</li>
                    <li>${t.bedLevelingStep2}</li>
                    <li>${t.bedLevelingStep3}</li>
                </ol>
            </div>

            <!-- Usage Instructions -->
            <div class="info-box" style="flex-direction: column; align-items: flex-start; margin-bottom: 2rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2);">
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; cursor: pointer;" id="usage-toggle">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="book-open" style="color: var(--success);"></i>
                        <h4 style="margin:0;">${t.usageInstructions}</h4>
                    </div>
                    <i data-lucide="chevron-down" id="usage-chevron" style="color: var(--success); transition: transform 0.3s;"></i>
                </div>
                
                <div id="usage-content" style="display: none; width: 100%; margin-top: 0.5rem;">
                    <div style="margin-top: 0.5rem;">
                        <p style="margin: 0 0 0.5rem 0; font-size: 0.9em;"><strong>${t.manualPaperMethod}</strong></p>
                        <p style="margin: 0 0 0.5rem 0; font-size: 0.85em; opacity: 0.9;">
                            ${t.usePaperMethod} <a href="https://klipper.3dwork.io/klipper/empezamos/nivelacion-cama-manual#nivelacion-manual" target="_blank" style="color: var(--primary-light); text-decoration: underline;">3Dwork Klipper Guide</a>
                        </p>
                        <code style="background: rgba(0,0,0,0.3); padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.85em;">BED_SCREWS_ADJUST</code>
                    </div>

                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
                        <p style="margin: 0 0 0.5rem 0; font-size: 0.9em;"><strong>${t.probeAssistedMethod}</strong></p>
                        <p style="margin: 0 0 0.5rem 0; font-size: 0.85em; opacity: 0.9;">
                            ${t.useProbeMethod} <a href="https://klipper.3dwork.io/klipper/empezamos/nivelacion-cama-manual#nivelacion-manual-cama-con-sensor" target="_blank" style="color: var(--primary-light); text-decoration: underline;">3Dwork Klipper Guide</a>
                        </p>
                        <p style="margin: 0 0 0.5rem 0; font-size: 0.85em; opacity: 0.9;">
                            <code style="background: rgba(0,0,0,0.3); padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.85em;">SCREWS_TILT_CALCULATE DIRECTION=<span id="direction-hint">CW</span></code>
                        </p>
                        <p style="margin: 0.5rem 0; font-size: 0.85em; opacity: 0.9;">${t.directionNote}</p>
                        <img src="https://klipper.3dwork.io/~gitbook/image?url=https%3A%2F%2Fcontent.gitbook.com%2Fcontent%2FH6gCE2fgkkpOScJ72TP7%2Fblobs%2Fb3V5tZT9Wste9PVQS1jJ%2Fimage.png&width=768&dpr=1&quality=100&sign=3dae5829&sv=2" 
                             alt="Screw direction reference" 
                             style="width: 100%; max-width: 400px; margin-top: 0.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                    </div>
                </div>
            </div>

            <div class="leveling-layout">
                <!-- Left Sidebar: Config Import & Settings -->
                <div class="leveling-sidebar">
                    <div class="step-container">
                        <h3><i data-lucide="upload"></i> ${t.importConfig}</h3>
                        <p class="text-sm text-muted">${t.importConfigDesc}</p>
                        
                        <div class="file-upload-zone" id="drop-zone-leveling">
                            <input type="file" id="cfg-file-input-leveling" accept=".cfg,.txt">
                            <i data-lucide="file-code" style="font-size: 2rem; margin-bottom: 10px; color: var(--primary);"></i>
                            <p>${t.dropZoneText}</p>
                        </div>

                        <button id="btn-demo-leveling" class="btn-secondary" style="width:100%; margin-top: 10px;">
                            <i data-lucide="play-circle"></i> ${t.loadDemo}
                        </button>
                    </div>

                    <div class="step-container" style="margin-top: 2rem;">
                        <h3><i data-lucide="settings"></i> ${t.bedDimensions}</h3>
                        
                        <div class="form-row">
                            <div class="input-group">
                                <label>X Max (mm)</label>
                                <input type="number" id="bed-x-max" value="300" step="1">
                            </div>
                            <div class="input-group">
                                <label>Y Max (mm)</label>
                                <input type="number" id="bed-y-max" value="300" step="1">
                            </div>
                        </div>
                    </div>

                    <div class="step-container" style="margin-top: 2rem;">
                        <h3><i data-lucide="target"></i> ${t.probeOffset}</h3>
                        
                        <div class="form-row">
                            <div class="input-group">
                                <label>X Offset (mm)</label>
                                <input type="number" id="probe-x-offset" value="0" step="0.1">
                            </div>
                            <div class="input-group">
                                <label>Y Offset (mm)</label>
                                <input type="number" id="probe-y-offset" value="0" step="0.1">
                            </div>
                        </div>
                        <p class="text-sm text-muted" style="margin-top: 0.5rem;">${t.probeOffsetDesc}</p>
                    </div>
                </div>

                <!-- Right: Screw Positions & Visualization -->
                <div class="leveling-main">
                    <h3><i data-lucide="map-pin"></i> ${t.screwPositions}</h3>
                    <p class="text-sm text-muted" style="margin-bottom: 1.5rem;">${t.screwPositionsDesc}</p>

                    <!-- Screw Input Grid (Visual Layout) -->
                    <div class="screw-input-grid">
                        <!-- Top Row -->
                        <div class="screw-input-cell">
                            <label>${t.leftRear}</label>
                            <div style="display: flex; gap: 5px;">
                                <input type="number" id="screw-lr-x" placeholder="X" step="1">
                                <input type="number" id="screw-lr-y" placeholder="Y" step="1">
                            </div>
                        </div>
                        <div class="screw-input-cell" style="visibility: hidden;"></div>
                        <div class="screw-input-cell">
                            <label>${t.rightRear}</label>
                            <div style="display: flex; gap: 5px;">
                                <input type="number" id="screw-rr-x" placeholder="X" step="1">
                                <input type="number" id="screw-rr-y" placeholder="Y" step="1">
                            </div>
                        </div>

                        <!-- Middle Row (Optional Center) -->
                        <div class="screw-input-cell">
                            <label>${t.leftCenter} <span style="opacity:0.5;">(${t.optional})</span></label>
                            <div style="display: flex; gap: 5px;">
                                <input type="number" id="screw-lc-x" placeholder="X" step="1">
                                <input type="number" id="screw-lc-y" placeholder="Y" step="1">
                            </div>
                        </div>
                        <div class="screw-input-cell">
                            <label>${t.center} <span style="opacity:0.5;">(${t.optional})</span></label>
                            <div style="display: flex; gap: 5px;">
                                <input type="number" id="screw-c-x" placeholder="X" step="1">
                                <input type="number" id="screw-c-y" placeholder="Y" step="1">
                            </div>
                        </div>
                        <div class="screw-input-cell">
                            <label>${t.rightCenter} <span style="opacity:0.5;">(${t.optional})</span></label>
                            <div style="display: flex; gap: 5px;">
                                <input type="number" id="screw-rc-x" placeholder="X" step="1">
                                <input type="number" id="screw-rc-y" placeholder="Y" step="1">
                            </div>
                        </div>

                        <!-- Bottom Row -->
                        <div class="screw-input-cell">
                            <label>${t.leftFront}</label>
                            <div style="display: flex; gap: 5px;">
                                <input type="number" id="screw-lf-x" placeholder="X" step="1">
                                <input type="number" id="screw-lf-y" placeholder="Y" step="1">
                            </div>
                        </div>
                        <div class="screw-input-cell" style="visibility: hidden;"></div>
                        <div class="screw-input-cell">
                            <label>${t.rightFront}</label>
                            <div style="display: flex; gap: 5px;">
                                <input type="number" id="screw-rf-x" placeholder="X" step="1">
                                <input type="number" id="screw-rf-y" placeholder="Y" step="1">
                            </div>
                        </div>
                    </div>

                    <div class="form-row" style="margin-top: 2rem;">
                        <div class="input-group">
                            <label>${t.screwThread}</label>
                            <select id="screw-thread-type" style="width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: var(--text-main); font-size: 0.9rem;">
                                <option value="CW-M3">CW-M3</option>
                                <option value="CCW-M3">CCW-M3</option>
                                <option value="CW-M4" selected>CW-M4</option>
                                <option value="CCW-M4">CCW-M4</option>
                                <option value="CW-M5">CW-M5</option>
                                <option value="CCW-M5">CCW-M5</option>
                            </select>
                        </div>
                    </div>

                    <button id="btn-calculate" class="btn-primary" style="width: 100%; margin-top: 2rem;">
                        <i data-lucide="calculator"></i> ${t.calculateCoords}
                    </button>

                    <!-- Results -->
                    <div id="leveling-results" style="display:none; margin-top: 2rem;">
                        <h3>${t.generatedConfig}</h3>
                        
                        <div class="tabs" style="margin-top: 1rem;">
                            <button class="tab-btn active" data-tab="bed-screws-config">[bed_screws]</button>
                            <button class="tab-btn" data-tab="screws-tilt-config">[screws_tilt_adjust]</button>
                        </div>

                        <div id="bed-screws-config" class="viz-container active">
                            <p class="text-sm text-muted">${t.bedScrewsDesc}</p>
                            <textarea id="output-bed-screws" readonly style="width:100%; height: 200px; margin-top: 0.5rem; color: var(--text-muted); background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); padding: 0.5rem; border-radius: 8px; font-family: monospace;"></textarea>
                        </div>

                        <div id="screws-tilt-config" class="viz-container">
                            <p class="text-sm text-muted">${t.screwsTiltDesc2}</p>
                            <textarea id="output-screws-tilt" readonly style="width:100%; height: 200px; margin-top: 0.5rem; color: var(--text-muted); background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); padding: 0.5rem; border-radius: 8px; font-family: monospace;"></textarea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // --- Logic ---
    const fileInput = document.getElementById('cfg-file-input-leveling');
    const dropZone = document.getElementById('drop-zone-leveling');

    const demoConfig = `
[stepper_x]
position_max: 300

[stepper_y]
position_max: 300

[probe]
x_offset: -44
y_offset: -6

[screws_tilt_adjust]
screw1: 74, 47
screw1_name: Front Left
screw2: 245, 47
screw2_name: Front Right
screw3: 245, 217
screw3_name: Rear Right
screw4: 74, 217
screw4_name: Rear Left
horizontal_move_z: 10
speed: 50
screw_thread: CW-M4
    `;

    // Demo Button
    document.getElementById('btn-demo-leveling').addEventListener('click', () => {
        parseConfig(demoConfig);
    });

    // File Upload
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) processFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) processFile(e.target.files[0]);
    });

    // Update direction hint when screw thread type changes
    document.getElementById('screw-thread-type').addEventListener('change', (e) => {
        const direction = e.target.value.startsWith('CW') ? 'CW' : 'CCW';
        document.getElementById('direction-hint').textContent = direction;
    });

    // Toggle usage instructions
    document.getElementById('usage-toggle').addEventListener('click', () => {
        const content = document.getElementById('usage-content');
        const chevron = document.getElementById('usage-chevron');
        const isVisible = content.style.display !== 'none';

        content.style.display = isVisible ? 'none' : 'block';
        chevron.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';

        if (window.lucide) window.lucide.createIcons();
    });

    function processFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => parseConfig(e.target.result);
        reader.readAsText(file);
    }

    function parseConfig(content) {
        try {
            // Parse bed size
            const stepXBlock = content.match(/\[stepper_x\][\s\S]*?(?=\[|$)/);
            if (stepXBlock) {
                const max = stepXBlock[0].match(/position_max\s*[:=]\s*([-0-9.]+)/);
                if (max) document.getElementById('bed-x-max').value = parseFloat(max[1]);
            }

            const stepYBlock = content.match(/\[stepper_y\][\s\S]*?(?=\[|$)/);
            if (stepYBlock) {
                const max = stepYBlock[0].match(/position_max\s*[:=]\s*([-0-9.]+)/);
                if (max) document.getElementById('bed-y-max').value = parseFloat(max[1]);
            }

            // Parse probe offset (check multiple possible sections)
            let xOffset = 0, yOffset = 0;

            // Try [probe]
            const probeBlock = content.match(/\[probe\][\s\S]*?(?=\[|$)/);
            if (probeBlock) {
                const xMatch = probeBlock[0].match(/x_offset\s*[:=]\s*([-0-9.]+)/);
                const yMatch = probeBlock[0].match(/y_offset\s*[:=]\s*([-0-9.]+)/);
                if (xMatch) xOffset = parseFloat(xMatch[1]);
                if (yMatch) yOffset = parseFloat(yMatch[1]);
            }

            // Try [bltouch]
            const bltouchBlock = content.match(/\[bltouch\][\s\S]*?(?=\[|$)/);
            if (bltouchBlock) {
                const xMatch = bltouchBlock[0].match(/x_offset\s*[:=]\s*([-0-9.]+)/);
                const yMatch = bltouchBlock[0].match(/y_offset\s*[:=]\s*([-0-9.]+)/);
                if (xMatch) xOffset = parseFloat(xMatch[1]);
                if (yMatch) yOffset = parseFloat(yMatch[1]);
            }

            document.getElementById('probe-x-offset').value = xOffset;
            document.getElementById('probe-y-offset').value = yOffset;

            // Parse screw positions if they exist
            const screwsBlock = content.match(/\[screws_tilt_adjust\][\s\S]*?(?=\[|$)/);
            if (screwsBlock) {
                const screwRegex = /screw\d+\s*[:=]\s*([-0-9.]+)\s*,\s*([-0-9.]+)/g;
                const matches = [...screwsBlock[0].matchAll(screwRegex)];

                // Map to inputs (assuming order: LF, RF, RR, LR or similar)
                if (matches.length >= 4) {
                    // Typically: screw1=LF, screw2=RF, screw3=RR, screw4=LR
                    document.getElementById('screw-lf-x').value = parseFloat(matches[0][1]);
                    document.getElementById('screw-lf-y').value = parseFloat(matches[0][2]);
                    document.getElementById('screw-rf-x').value = parseFloat(matches[1][1]);
                    document.getElementById('screw-rf-y').value = parseFloat(matches[1][2]);
                    document.getElementById('screw-rr-x').value = parseFloat(matches[2][1]);
                    document.getElementById('screw-rr-y').value = parseFloat(matches[2][2]);
                    document.getElementById('screw-lr-x').value = parseFloat(matches[3][1]);
                    document.getElementById('screw-lr-y').value = parseFloat(matches[3][2]);
                }
                if (matches.length >= 5) {
                    document.getElementById('screw-c-x').value = parseFloat(matches[4][1]);
                    document.getElementById('screw-c-y').value = parseFloat(matches[4][2]);
                }
            }

        } catch (err) {
            console.error(err);
            alert(t.errorParse + ": " + err.message);
        }
    }

    // Calculate Button
    document.getElementById('btn-calculate').addEventListener('click', () => {
        calculateCoordinates();
    });

    function calculateCoordinates() {
        const probeX = parseFloat(document.getElementById('probe-x-offset').value) || 0;
        const probeY = parseFloat(document.getElementById('probe-y-offset').value) || 0;
        const bedX = parseFloat(document.getElementById('bed-x-max').value) || 300;
        const bedY = parseFloat(document.getElementById('bed-y-max').value) || 300;

        // Calculate center point automatically
        const centerX = bedX / 2;
        const centerY = bedY / 2;

        const screws = [
            { id: 'lf', name: 'Front Left', x: 'screw-lf-x', y: 'screw-lf-y' },
            { id: 'rf', name: 'Front Right', x: 'screw-rf-x', y: 'screw-rf-y' },
            { id: 'rr', name: 'Rear Right', x: 'screw-rr-x', y: 'screw-rr-y' },
            { id: 'lr', name: 'Rear Left', x: 'screw-lr-x', y: 'screw-lr-y' },
            { id: 'lc', name: 'Left Center', x: 'screw-lc-x', y: 'screw-lc-y' },
            { id: 'rc', name: 'Right Center', x: 'screw-rc-x', y: 'screw-rc-y' }
        ];

        let bedScrewsConfig = '[bed_screws]\n';
        let screwsTiltConfig = '[screws_tilt_adjust]\n';

        // Add center as screw1 (reference point) in screws_tilt_adjust
        const centerProbeX = centerX - probeX;
        const centerProbeY = centerY - probeY;
        screwsTiltConfig += `screw1: ${centerProbeX.toFixed(1)}, ${centerProbeY.toFixed(1)}\n`;
        screwsTiltConfig += `screw1_name: Center (Reference)\n`;

        let bedScrewIndex = 1;
        let tiltScrewIndex = 2; // Start at 2 since center is screw1
        const validScrews = [];
        const centerScrew = { x: centerX, y: centerY, probeX: centerProbeX, probeY: centerProbeY, name: 'Center (Reference)', isCenter: true };
        validScrews.push(centerScrew);

        screws.forEach(screw => {
            const xInput = document.getElementById(screw.x);
            const yInput = document.getElementById(screw.y);
            const x = parseFloat(xInput.value);
            const y = parseFloat(yInput.value);

            if (!isNaN(x) && !isNaN(y) && x > 0 && y > 0) {
                // bed_screws: physical screw location (no center)
                bedScrewsConfig += `screw${bedScrewIndex}: ${x}, ${y}\n`;
                bedScrewsConfig += `screw${bedScrewIndex}_name: ${screw.name}\n`;
                bedScrewIndex++;

                // screws_tilt_adjust: probe location (with center as reference)
                const probeTargetX = x - probeX;
                const probeTargetY = y - probeY;
                screwsTiltConfig += `screw${tiltScrewIndex}: ${probeTargetX.toFixed(1)}, ${probeTargetY.toFixed(1)}\n`;
                screwsTiltConfig += `screw${tiltScrewIndex}_name: ${screw.name}\n`;
                tiltScrewIndex++;

                validScrews.push({ x, y, probeX: probeTargetX, probeY: probeTargetY, name: screw.name, isCenter: false });
            }
        });

        screwsTiltConfig += 'horizontal_move_z: 10\n';
        screwsTiltConfig += 'speed: 50\n';

        const screwThread = document.getElementById('screw-thread-type').value;
        screwsTiltConfig += `screw_thread: ${screwThread}\n`;

        document.getElementById('output-bed-screws').value = bedScrewsConfig;
        document.getElementById('output-screws-tilt').value = screwsTiltConfig;
        document.getElementById('leveling-results').style.display = 'block';
    }

    // Tab Logic
    container.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            container.querySelectorAll('.viz-container').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    if (window.lucide) window.lucide.createIcons();
};

// CSS for this component
const style = document.createElement('style');
style.textContent = `
    .leveling-layout {
        display: flex;
        gap: 2rem;
        align-items: flex-start;
    }
    .leveling-sidebar {
        width: 350px;
        flex-shrink: 0;
    }
    .leveling-main {
        flex: 1;
    }
    .screw-input-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 1rem;
        background: rgba(0,0,0,0.2);
        padding: 1.5rem;
        border-radius: 12px;
    }
    .screw-input-cell {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .screw-input-cell label {
        font-size: 0.85rem;
        color: var(--text-muted);
        font-weight: 600;
    }
    .screw-input-cell input {
        width: 100%;
        padding: 0.5rem;
        font-size: 0.9rem;
    }
    @media (max-width: 900px) {
        .leveling-layout {
            flex-direction: column;
        }
        .leveling-sidebar {
            width: 100%;
        }
        .screw-input-grid {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(style);
