window.renderBedMesh = function (container, t) {
    const demoConfig = `
[stepper_x]
position_endstop: 0
position_max: 300

[stepper_y]
position_endstop: 0
position_max: 300

[bed_mesh]
mesh_min = 25, 25
mesh_max = 275, 275
#*# <---------------------- SAVE_CONFIG ---------------------->
#*# [bed_mesh default]
#*# version = 1
#*# points =
#*# 	  0.150000, 0.080000, 0.020000, 0.080000, 0.150000
#*# 	  0.080000, 0.000000, -0.050000, 0.000000, 0.080000
#*# 	  0.020000, -0.050000, -0.120000, -0.050000, 0.020000
#*# 	  0.080000, 0.000000, -0.050000, 0.000000, 0.080000
#*# 	  0.150000, 0.080000, 0.020000, 0.080000, 0.150000
#*# x_count = 5
#*# y_count = 5
#*# min_x = 25.0
#*# max_x = 275.0
#*# min_y = 25.0
#*# max_y = 275.0
    `;

    container.innerHTML = `
        <div class="card bed-mesh-tool">
            <h2><i data-lucide="grid-3x3"></i> ${t.bedMeshTitle}</h2>
            
            <!-- How It Works (Top) -->
            <div class="info-box mobile-hidden" style="flex-direction: column; align-items: flex-start; margin-bottom: 2rem; background: rgba(255,255,255,0.03);">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <i data-lucide="info" style="color: var(--primary-light);"></i>
                    <h4 style="margin:0;">${t.howItWorks}</h4>
                </div>
                <p style="margin:0; font-size: 0.9em; opacity: 0.8;">${t.howItWorksDesc}</p>
            </div>

            <div class="mesh-layout">
                <!-- Input Section -->
                <div class="mesh-sidebar">
                    <div class="step-container">
                        <h3><i data-lucide="upload"></i> ${t.importConfig}</h3>
                        <p class="text-sm text-muted">${t.importConfigDesc}</p>
                        
                        <div class="file-upload-zone" id="drop-zone">
                            <input type="file" id="cfg-file-input" accept=".cfg,.txt">
                            <i data-lucide="file-code" style="font-size: 2rem; margin-bottom: 10px; color: var(--primary);"></i>
                            <p>${t.dropZoneText}</p>
                        </div>

                        <button id="btn-demo" class="btn-secondary" style="width:100%; margin-top: 10px;">
                            <i data-lucide="play-circle"></i> ${t.loadDemo}
                        </button>

                        <div class="form-row" style="margin-top: 20px;">
                            <div class="input-group">
                                <label>${t.tapeThickness} (mm)</label>
                                <div style="display:flex; gap:10px;">
                                    <input type="number" id="tape-thickness" value="0.05" step="0.01">
                                    <button id="btn-recalc" class="btn-primary" style="padding: 0 1rem; border-radius: 12px;">
                                        <i data-lucide="refresh-cw"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="mesh-stats" class="stats-grid" style="display:none; grid-template-columns: 1fr 1fr 1fr;">
                        <div class="stat-card">
                            <span class="label">${t.bedSize}</span>
                            <span class="value" id="stats-bed-size">-</span>
                        </div>
                        <div class="stat-card">
                            <span class="label">${t.meshMatrix}</span>
                            <span class="value" id="stats-matrix">-</span>
                        </div>

                        <div class="stat-card">
                            <span class="label">${t.meshRange}</span>
                            <span class="value" id="stats-range">-</span>
                        </div>
                        <div class="stat-card">
                            <span class="label">${t.stdDev}</span>
                            <span class="value" id="stats-std">-</span>
                        </div>
                         <div class="stat-card">
                            <span class="label">${t.maxZ}</span>
                            <span class="value" id="stats-max">-</span>
                        </div>
                        <div class="stat-card">
                            <span class="label">${t.minZ}</span>
                            <span class="value" id="stats-min">-</span>
                        </div>
                    </div>
                </div>

                <!-- Visualization Section -->
                <div class="mesh-viz-area">
                    
                    <!-- Tab Navigation -->
                    <div class="tabs">
                        <button class="tab-btn active" data-tab="tape-view">${t.tapeView}</button>
                        <button class="tab-btn" data-tab="mesh-view">${t.meshView}</button>
                        <button class="tab-btn" data-tab="config-view">${t.cfgTab}</button>
                    </div>

                    <!-- Tape View (Visual Grid + Matrix + Estimation) -->
                    <div id="tape-view" class="viz-container active">
                        
                        <!-- Tape Info Header -->
                        <div id="tape-info-header" style="display:none; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 1rem; border-radius: 12px; margin-bottom: 2rem; text-align: center;">
                            <h3 style="font-size:1.1rem; color:var(--text-main); margin-bottom:0.5rem;">${t.squareSize}: <span id="calc-square-size" style="color:var(--secondary); font-weight:bold;">-</span></h3>
                            <p style="font-size:0.9rem; color:var(--text-muted); line-height:1.4;">${t.tapeIntro}</p>
                        </div>

                        <!-- 1. Visual Shimming Grid -->
                        <div id="tape-grid" class="mesh-grid">
                            <div class="placeholder-msg">${t.uploadToSee}</div>
                        </div>
                        <div class="legend" id="tape-legend" style="display:none; justify-content:center; margin-bottom: 2rem;">
                            <span><span class="dot" style="background:var(--success)"></span> 0 ${t.layers}</span>
                            <span><span class="dot" style="background:#facc15"></span> 1-2 ${t.layers}</span>
                            <span><span class="dot" style="background:#dc2626"></span> 3+ ${t.layers}</span>
                        </div>

                        <!-- 3. Estimated Result Heatmap -->
                        <div id="estimated-mesh-container" style="display:none; margin-top: 3rem;">
                             <h3 style="font-size: 1.1rem; color: var(--text-muted); margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;">
                                <i data-lucide="check-circle-2"></i> ${t.estimatedMesh}
                            </h3>
                            <div id="estimated-grid" class="mesh-grid heatmap"></div>
                        </div>

                    </div>

                    <!-- Raw Mesh View -->
                    <div id="mesh-view" class="viz-container">
                        <div id="mesh-grid" class="mesh-grid heatmap">
                             <div class="placeholder-msg">${t.uploadToSee}</div>
                        </div>
                         <div class="legend" id="mesh-legend" style="display:none;">
                            <div class="gradient-bar"></div>
                            <div class="legend-labels">
                                <span id="legend-min">Min</span>
                                <span id="legend-max">Max</span>
                            </div>
                        </div>
                    </div>

                    <!-- Config View -->
                    <div id="config-view" class="viz-container">
                        <textarea id="config-content" readonly style="width:100%; height: 100%; min-height: 500px; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); color: var(--text-muted); font-family: monospace; font-size: 0.85rem; padding: 1rem; border-radius: 12px; resize: none;"></textarea>
                    </div>
                </div>
            </div>
        </div>
    `;

    // --- Interaction Logic ---
    const fileInput = document.getElementById('cfg-file-input');
    const dropZone = document.getElementById('drop-zone');
    const tapeInput = document.getElementById('tape-thickness');

    // Data Storage
    let meshData = null; // { points: [[z1, z2], ...], minX, maxX, minY, maxY, rows, cols }

    // Demo Button
    document.getElementById('btn-demo').addEventListener('click', () => {
        parseConfig(demoConfig);
    });

    // Recalculate Button
    document.getElementById('btn-recalc').addEventListener('click', () => {
        if (meshData) renderVisualizations();
    });

    // File Drag & Drop
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

    tapeInput.addEventListener('input', () => {
        // Optional: auto-calc or only button? User asked for button. 
        // We can keep auto-calc for better UX or disable it. 
        // "add a recalculate button... to make calculations if this value is updated"
        // I will keep live update because it's superior UX, but the button satisfies the specific request for explicit control/affordance.
        if (meshData) renderVisualizations();
    });

    // Tab Logic
    container.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            container.querySelectorAll('.viz-container').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    function processFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => parseConfig(e.target.result);
        reader.readAsText(file);
    }

    function parseConfig(content) {
        try {
            document.getElementById('config-content').value = content;

            // 0. Find Bed Size (stepper_x/y position_max)
            let bedX = null;
            let bedY = null;

            const stepXBlock = content.match(/\[stepper_x\][\s\S]*?(?=\[|$)/);
            if (stepXBlock) {
                const max = stepXBlock[0].match(/position_max\s*[:=]\s*([-0-9.]+)/);
                if (max) bedX = parseFloat(max[1]);
            }

            const stepYBlock = content.match(/\[stepper_y\][\s\S]*?(?=\[|$)/);
            if (stepYBlock) {
                const max = stepYBlock[0].match(/position_max\s*[:=]\s*([-0-9.]+)/);
                if (max) bedY = parseFloat(max[1]);
            }

            // 1. Find Mesh Config (mesh_min, mesh_max) - usually in [bed_mesh]
            let meshMin = [0, 0];
            let meshMax = [220, 220];

            const minMatch = content.match(/mesh_min\s*[:=]\s*([0-9.,\s]+)/);
            if (minMatch) {
                const parts = minMatch[1].split(/[,\s]+/).map(parseFloat).filter(n => !isNaN(n));
                if (parts.length >= 2) meshMin = parts;
            }

            const maxMatch = content.match(/mesh_max\s*[:=]\s*([0-9.,\s]+)/);
            if (maxMatch) {
                const parts = maxMatch[1].split(/[,\s]+/).map(parseFloat).filter(n => !isNaN(n));
                if (parts.length >= 2) meshMax = parts;
            }

            // 2. Find the Saved Mesh (default)
            const meshBlockRegex = /#\*#\s*\[bed_mesh\s+default\][\s\S]*?#\*#\s*points\s*=\s*((?:#\*#\s+[-0-9.,\s]+\n?)+)/;
            const match = content.match(meshBlockRegex);

            if (!match) {
                alert(t.errorNoMesh);
                return;
            }

            const rawPoints = match[1];
            // Parse lines
            const lines = rawPoints.split('\n')
                .map(l => l.replace('#*#', '').trim())
                .filter(l => l.length > 0);

            const matrix = lines.map(line =>
                line.split(/[,\s]+/)
                    .map(parseFloat)
                    .filter(n => !isNaN(n))
            ).filter(row => row.length > 0);

            if (matrix.length === 0) throw new Error("No points found");

            // Define physical bed size: use found stepper limits OR probed area as fallback
            const physicalW = bedX ? bedX : (meshMax[0] - meshMin[0]);
            const physicalH = bedY ? bedY : (meshMax[1] - meshMin[1]);

            meshData = {
                points: matrix,
                rows: matrix.length,
                cols: matrix[0].length,
                minX: meshMin[0],
                maxX: meshMax[0],
                minY: meshMin[1],
                maxY: meshMax[1],
                bedW: physicalW,
                bedH: physicalH
            };

            calculateStats();
            renderVisualizations();
            document.getElementById('mesh-stats').style.display = 'grid';
            document.getElementById('tape-legend').style.display = 'flex';
            document.getElementById('mesh-legend').style.display = 'flex';
            document.getElementById('tape-info-header').style.display = 'block';
            document.getElementById('estimated-mesh-container').style.display = 'block';

        } catch (err) {
            console.error(err);
            alert(t.errorParse + ": " + err.message);
        }
    }

    function calculateStats() {
        const flat = meshData.points.flat();
        const max = Math.max(...flat);
        const min = Math.min(...flat);
        const avg = flat.reduce((a, b) => a + b, 0) / flat.length;

        // Std Dev
        const variance = flat.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / flat.length;
        const std = Math.sqrt(variance);

        document.getElementById('stats-bed-size').textContent = `${(meshData.bedW || 0).toFixed(0)}x${(meshData.bedH || 0).toFixed(0)} mm`;
        document.getElementById('stats-matrix').textContent = `${meshData.cols}x${meshData.rows}`;

        document.getElementById('stats-range').textContent = (max - min).toFixed(3) + ' mm';
        document.getElementById('stats-std').textContent = std.toFixed(4) + ' mm';
        document.getElementById('stats-max').textContent = max.toFixed(3) + ' mm';
        document.getElementById('stats-min').textContent = min.toFixed(3) + ' mm';
    }

    function renderVisualizations() {
        const tapeH = parseFloat(document.getElementById('tape-thickness').value) || 0.05;
        const flat = meshData.points.flat();
        const maxZ = Math.max(...flat);

        // Update Square Size Calculation
        // Use full bed size divided by number of points to get "tile" size
        const w = meshData.bedW || (meshData.maxX - meshData.minX);
        const h = meshData.bedH || (meshData.maxY - meshData.minY);

        const sqW = w / meshData.cols;
        const sqH = h / meshData.rows;
        document.getElementById('calc-square-size').textContent = `${sqW.toFixed(1)}mm x ${sqH.toFixed(1)}mm`;

        // Grid CSS
        const gridStyle = `grid-template-columns: repeat(${meshData.cols}, 1fr);`;

        const visualRows = [...meshData.points].reverse();

        // 1. Tape Grid
        const tapeGrid = document.getElementById('tape-grid');
        tapeGrid.style.cssText = gridStyle;
        tapeGrid.innerHTML = '';

        const tapeCounts = [];

        visualRows.forEach((row, rIndex) => {
            const rowTapeCounts = [];

            row.forEach((zVal, cIndex) => {
                const deficit = maxZ - zVal;
                const count = Math.round(deficit / tapeH);
                rowTapeCounts.push(count);

                // --- Visual Grid Cell ---
                const cell = document.createElement('div');
                cell.className = 'grid-cell tape-cell';
                if (count === 0) cell.classList.add('tape-0');
                else if (count <= 2) cell.classList.add('tape-low');
                else cell.classList.add('tape-high');

                cell.innerHTML = `
                    <span class="tape-count">${count > 0 ? 'x' + count : '<i data-lucide="check"></i>'}</span>
                    <span class="z-val">${zVal.toFixed(3)}</span>
                `;
                tapeGrid.appendChild(cell);
            });
            tapeCounts.push(rowTapeCounts);
        });

        // 2 & 3. Mesh Heatmap & Estimated Heatmap
        const meshGrid = document.getElementById('mesh-grid');
        meshGrid.style.cssText = gridStyle;
        meshGrid.innerHTML = '';

        const estGrid = document.getElementById('estimated-grid');
        estGrid.style.cssText = gridStyle;
        estGrid.innerHTML = '';

        const range = maxZ - Math.min(...flat);
        const minZ = Math.min(...flat);

        const getColor = (z) => {
            let norm = (z - minZ) / (range || 0.001);
            norm = Math.max(0, Math.min(1, norm));
            const hue = 240 - (norm * 240);
            return `hsl(${hue}, 70%, 50%)`;
        };

        visualRows.forEach((row, rIndex) => {
            row.forEach((zVal, cIndex) => {
                // Orig
                const cell = document.createElement('div');
                cell.className = 'grid-cell mesh-cell';
                cell.style.backgroundColor = getColor(zVal);
                cell.title = `Z: ${zVal.toFixed(3)}`;
                cell.textContent = zVal.toFixed(3);
                meshGrid.appendChild(cell);

                // Estimated
                const count = tapeCounts[rIndex][cIndex];
                const estZ = zVal + (count * tapeH);

                const cellEst = document.createElement('div');
                cellEst.className = 'grid-cell mesh-cell';

                cellEst.style.backgroundColor = getColor(estZ);
                cellEst.title = `Est Z: ${estZ.toFixed(3)}`;
                cellEst.textContent = estZ.toFixed(3);
                estGrid.appendChild(cellEst);
            });
        });

        document.getElementById('legend-min').textContent = minZ.toFixed(3);
        document.getElementById('legend-max').textContent = maxZ.toFixed(3);

        if (window.lucide) window.lucide.createIcons();
    }

    if (window.lucide) window.lucide.createIcons();
};
