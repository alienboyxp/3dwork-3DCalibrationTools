window.renderShaper = function (container, t) {
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2><i data-lucide="activity"></i> ${t.shaperTitle}</h2>
                <p>${t.shaperSummary}</p>
            </div>

            <div class="calculator-grid shaper-layout" style="display: flex; flex-direction: column; gap: 2rem;">
                <!-- UPLOAD SECTION -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    <div class="upload-zone" id="drop-zone-x">
                        <i data-lucide="upload-cloud"></i>
                        <p>${t.uploadX}</p>
                        <span class="file-name" id="file-name-x"></span>
                        <input type="file" id="input-x" accept=".csv" style="display: none;">
                    </div>
                    <div class="upload-zone" id="drop-zone-y">
                        <i data-lucide="upload-cloud"></i>
                        <p>${t.uploadY}</p>
                        <span class="file-name" id="file-name-y"></span>
                        <input type="file" id="input-y" accept=".csv" style="display: none;">
                    </div>
                </div>

                <!-- SIMULATION BUTTON -->
                <div style="text-align: center;">
                    <button id="btn-load-demo" class="btn-secondary" style="padding: 0.75rem 2rem; border-radius: 12px; display: flex; align-items: center; gap: 0.5rem; margin: 0 auto;">
                        <i data-lucide="play-circle"></i> ${t.loadDemo}
                    </button>
                </div>

                <div id="no-data-msg" class="info-box" style="text-align: center; padding: 3rem;">
                    <i data-lucide="file-warning" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>${t.noData}</p>
                </div>

                <!-- MAIN RESONANCE CHART -->
                <div id="resonance-container" style="display: none; background: rgba(0,0,0,0.2); border-radius: 24px; padding: 1.5rem; border: 1px solid var(--glass-border);">
                    <h4 style="margin-bottom: 1rem; color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase;">${t.resonanceChartTitle || 'Resonance Spectrum (PSD)'}</h4>
                    <canvas id="resonance-chart"></canvas>
                </div>

                <!-- RESULTS SECTION -->
                <div id="shaper-results" style="display: none; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    <div class="result-card" id="results-x">
                        <h3 style="color: var(--primary-light); margin-bottom: 1rem;">${t.shaperResultsX}</h3>
                        <div class="shaper-table" id="table-x"></div>
                    </div>
                    <div class="result-card" id="results-y">
                        <h3 style="color: var(--secondary); margin-bottom: 1rem;">${t.shaperResultsY}</h3>
                        <div class="shaper-table" id="table-y"></div>
                    </div>
                </div>

                <!-- FULL CONFIG SECTION -->
                <div id="config-section" style="display: none; background: rgba(255,255,255,0.03); border-radius: 20px; padding: 1.5rem; border: 1px solid var(--glass-border);">
                    <h3 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem;">
                        <i data-lucide="file-code" style="color: var(--primary-light);"></i> ${t.generatedConfig || 'Klipper Configuration (printer.cfg)'}
                    </h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="config-card">
                            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">[input_shaper]</p>
                            <pre id="config-input-shaper" style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 12px; font-family: monospace; font-size: 0.9rem; color: var(--primary-light); overflow-x: auto;"></pre>
                        </div>
                        <div class="config-card" style="display: flex; flex-direction: column;">
                            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">[printer]</p>
                            <pre id="config-printer" style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 12px; font-family: monospace; font-size: 0.9rem; color: var(--primary-light); flex-grow: 1;"></pre>
                        </div>
                    </div>
                </div>

                <!-- SHAPER PERFORMANCE TABS & CHART -->
                <div id="analysis-container" style="display: none; background: rgba(0,0,0,0.2); border-radius: 24px; padding: 1.5rem; border: 1px solid var(--glass-border);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h4 style="color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase;">${t.analysisChartTitle || 'Shaper Performance: Vibration vs Acceleration'}</h4>
                        <div class="tabs" style="margin: 0; display: flex; gap: 0.5rem;">
                            <button class="tab-btn active" id="tab-perf-x" style="padding: 0.4rem 1rem; font-size: 0.8rem;">${t.axisX}</button>
                            <button class="tab-btn" id="tab-perf-y" style="padding: 0.4rem 1rem; font-size: 0.8rem;">${t.axisY}</button>
                        </div>
                    </div>
                    <canvas id="analysis-chart" style="max-height: 400px;"></canvas>
                </div>

                <!-- DOCUMENTATION FOOTER -->
                <div class="vref-docs" style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--glass-border);">
                    <h4 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.6rem; font-size: 1rem;">
                        <i data-lucide="book-open" style="width: 20px; height: 20px; color: var(--primary-light);"></i> ${t.firmwareDocs}
                    </h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <a href="https://klipper.3dwork.io/klipper/empezamos/input-shaper" target="_blank" class="doc-link" style="grid-column: span 2; background: rgba(139, 92, 246, 0.05); border-color: var(--primary);">
                            <i data-lucide="external-link"></i> ${t.shaperGuide}
                        </a>
                        <a href="https://www.klipper3d.org/Measuring_Resonances.html" target="_blank" class="doc-link">
                            <i data-lucide="external-link"></i> ${t.shaperDocs}
                        </a>
                        <a href="https://github.com/Frix-x/klippain-shaketune" target="_blank" class="doc-link">
                            <i data-lucide="external-link"></i> ${t.shaketuneDocs}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;

    // State
    let dataX = null;
    let dataY = null;
    let chart = null;
    let analysisChart = null;
    let perfAxis = 'X';

    // Elements
    const dropX = document.getElementById('drop-zone-x');
    const dropY = document.getElementById('drop-zone-y');
    const inputX = document.getElementById('input-x');
    const inputY = document.getElementById('input-y');
    const btnDemo = document.getElementById('btn-load-demo');
    const resonanceCont = document.getElementById('resonance-container');
    const resultsCont = document.getElementById('shaper-results');
    const configSection = document.getElementById('config-section');
    const analysisCont = document.getElementById('analysis-container');
    const noDataMsg = document.getElementById('no-data-msg');

    const configInputShaper = document.getElementById('config-input-shaper');
    const configPrinter = document.getElementById('config-printer');
    const tabPerfX = document.getElementById('tab-perf-x');
    const tabPerfY = document.getElementById('tab-perf-y');

    // Tab Logic for Performance Chart
    [tabPerfX, tabPerfY].forEach(btn => {
        btn.onclick = () => {
            tabPerfX.classList.remove('active');
            tabPerfY.classList.remove('active');
            btn.classList.add('active');
            perfAxis = btn.id.includes('-x') ? 'X' : 'Y';
            renderAnalysisChart();
        };
    });

    // Demo Data Generation
    function generateDemoData(peakFreq) {
        const data = { freq: [], psd: [] };
        for (let f = 1; f <= 133; f += 0.5) {
            data.freq.push(f);
            // Lorentzian-ish peak + noise
            const peak = 1e6 / (Math.pow(f - peakFreq, 2) + 4);
            const noise = Math.random() * 5000;
            data.psd.push(peak + noise);
        }
        return data;
    }

    btnDemo.onclick = () => {
        dataX = generateDemoData(46.4);
        dataY = generateDemoData(42.2);
        document.getElementById('file-name-x').textContent = 'demo_resonances_x.csv';
        document.getElementById('file-name-y').textContent = 'demo_resonances_y.csv';
        updateAnalysis();
    };

    // Setup Uploads
    [dropX, dropY].forEach((zone, idx) => {
        const input = (idx === 0) ? inputX : inputY;
        zone.onclick = () => input.click();
        zone.ondragover = (e) => { e.preventDefault(); zone.classList.add('active'); };
        zone.ondragleave = () => zone.classList.remove('active');
        zone.ondrop = (e) => {
            e.preventDefault();
            zone.classList.remove('active');
            if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0], idx);
        };
        input.onchange = (e) => {
            if (e.target.files.length) handleFile(e.target.files[0], idx);
        };
    });

    function handleFile(file, axisIdx) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = parseCSV(e.target.result);
            if (axisIdx === 0) {
                dataX = data;
                document.getElementById('file-name-x').textContent = file.name;
            } else {
                dataY = data;
                document.getElementById('file-name-y').textContent = file.name;
            }
            updateAnalysis();
        };
        reader.readAsText(file);
    }

    function parseCSV(text) {
        const lines = text.split('\n');
        const data = { freq: [], psd: [] };
        lines.forEach(line => {
            if (line.startsWith('#') || !line.trim()) return;
            const parts = line.split(',');
            if (parts.length >= 2) {
                data.freq.push(parseFloat(parts[0]));
                // Klipper CSVs usually have freq, psd_x, psd_y, psd_z or freq, psd_xyz
                // ShakeTune often uses column 1 (freq) and column 4 or 5 for the combined PSD
                data.psd.push(parseFloat(parts[parts.length - 1]));
            }
        });
        return data;
    }

    function updateAnalysis() {
        if (!dataX && !dataY) return;

        noDataMsg.style.display = 'none';
        resonanceCont.style.display = 'block';
        resultsCont.style.display = 'grid';
        configSection.style.display = 'block';
        analysisCont.style.display = 'block';

        renderChart();
        renderAnalysisChart();

        let recX = dataX ? processAxis(dataX, 'table-x', 'X') : null;
        let recY = dataY ? processAxis(dataY, 'table-y', 'Y') : null;

        updateConfigSnippet(recX, recY);
    }

    function updateConfigSnippet(x, y) {
        let shaperLines = [];
        if (x) {
            shaperLines.push(`shaper_type_x: ${x.type.toLowerCase()}`);
            shaperLines.push(`shaper_freq_x: ${x.freq.toFixed(1)}`);
        }
        if (y) {
            shaperLines.push(`shaper_type_y: ${y.type.toLowerCase()}`);
            shaperLines.push(`shaper_freq_y: ${y.freq.toFixed(1)}`);
        }
        configInputShaper.textContent = shaperLines.join('\n');

        // La aceleración máxima la fija SHAPER_CALIBRATE en la impresora:
        // no se inventa un número aquí, se indica el comando exacto.
        configPrinter.textContent =
            `# ${t.shaperAccelComment}\n` +
            `[printer]\nmax_accel: ${t.shaperAccelPlaceholder}\n` +
            `# max_accel_to_decel: ${t.shaperAccelPlaceholder}\n\n` +
            `# ${t.shaperCommand}\n# SHAPER_CALIBRATE`;
    }

    function renderChart() {
        const ctx = document.getElementById('resonance-chart').getContext('2d');
        if (chart) chart.destroy();

        const datasets = [];
        if (dataX) {
            datasets.push({
                label: 'Axis X',
                data: dataX.freq.map((f, i) => ({ x: f, y: dataX.psd[i] })),
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                fill: true,
                borderWidth: 2,
                pointRadius: 0
            });
        }
        if (dataY) {
            datasets.push({
                label: 'Axis Y',
                data: dataY.freq.map((f, i) => ({ x: f, y: dataY.psd[i] })),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                borderWidth: 2,
                pointRadius: 0
            });
        }

        chart = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                animation: false,
                interaction: { intersect: false, mode: 'index' },
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Frequency (Hz)', color: '#94A3B8' },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94A3B8' },
                        min: 0,
                        max: 133
                    },
                    y: {
                        title: { display: true, text: 'PSD (Power Spectral Density)', color: '#94A3B8' },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94A3B8' },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: { labels: { color: '#F1F5F9' } }
                }
            }
        });
    }

    function renderAnalysisChart() {
        const ctx = document.getElementById('analysis-chart').getContext('2d');
        if (analysisChart) analysisChart.destroy();

        // Use selected axis for performance simulation
        const baseData = (perfAxis === 'X') ? dataX : dataY;
        if (!baseData) return;

        // Detect peak for shaper tuning in simulation
        let maxVal = 0;
        let peakFreq = 0;
        for (let i = 0; i < baseData.psd.length; i++) {
            if (baseData.psd[i] > maxVal) {
                maxVal = baseData.psd[i];
                peakFreq = baseData.freq[i];
            }
        }

        // Shaper Response Formulas (Suppression Factor)
        const getZV = (f, fs) => Math.abs(Math.cos((Math.PI * f) / (2 * fs)));
        const getMZV = (f, fs) => Math.pow(Math.cos((Math.PI * f) / (2 * fs)), 2);
        const getEI = (f, fs) => {
            const x = (Math.PI * f) / fs;
            return Math.abs(0.25 * (1 + 2 * Math.cos(x) + Math.pow(Math.cos(x), 2))); // Simplified EI model
        };

        const freqs = [];
        for (let f = 1; f <= 133; f += 1) freqs.push(f);

        const recommended = 'MZV'; // For demo/default
        const shaperFreq = peakFreq;

        const datasets = [
            {
                label: `ZV Shaper (${perfAxis})`,
                data: freqs.map(f => ({ x: f, y: getZV(f, shaperFreq) })),
                borderColor: '#6366F1',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 2,
                pointStyle: 'circle',
                showLine: true
            },
            {
                label: `MZV Shaper (Recommended ${perfAxis})`,
                data: freqs.map(f => ({ x: f, y: getMZV(f, shaperFreq) })),
                borderColor: (perfAxis === 'X') ? '#8B5CF6' : '#10B981',
                borderWidth: 3,
                pointRadius: 0,
                showLine: true
            },
            {
                label: `EI Shaper (${perfAxis})`,
                data: freqs.map(f => ({ x: f, y: getEI(f, shaperFreq) })),
                borderColor: '#F59E0B',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 2,
                pointStyle: 'rectRot',
                showLine: true
            }
        ];

        analysisChart = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Frequency (Hz)', color: '#94A3B8' },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94A3B8' },
                        min: 0,
                        max: 133
                    },
                    y: {
                        title: { display: true, text: 'Vibration Suppression Ratio', color: '#94A3B8' },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94A3B8' },
                        min: 0,
                        max: 1.2
                    }
                },
                plugins: {
                    legend: { labels: { color: '#F1F5F9' } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed.y * 100).toFixed(1)}% residual`
                        }
                    }
                }
            }
        });
    }

    // Shapers: descripción cualitativa (sin inventar cifras de aceleración)
    const SHAPER_INFO = {
        ZV: { use: 'Un solo pico de resonancia, muy alto', smooth: 'mínimo', note: 'Cancela la vibración en una sola frecuencia; el menor suavizado, la mayor aceleración posible.' },
        MZV: { use: 'Resonancia baja (menos de 40 Hz)', smooth: 'bajo', note: 'Cancela la vibración y también las frecuencias por debajo de la de resonancia.' },
        EI: { use: 'Resonancia media-baja (30-50 Hz)', smooth: 'medio', note: 'Tres impulsos: funciona mejor que MZV en frecuencias bajas, a cambio de más suavizado.' },
        '2HUMP_EI': { use: 'Resonancia media-alta (45-60 Hz)', smooth: 'medio', note: 'Dos impulsos: pensado para resonancias por encima de los 45 Hz.' },
        '3HUMP_EI': { use: 'Resonancia alta (más de 60 Hz)', smooth: 'alto', note: 'Tres impulsos para resonancias altas; es el que más suaviza (y más aceleración pierde).' }
    };

    // Recomendación orientativa según la frecuencia de resonancia medida.
    // Los valores definitivos (aceleración y vibración) los da
    // SHAPER_CALIBRATE en tu impresora: aquí no se inventan.
    function recommendShaper(freq) {
        if (freq < 30) return 'MZV';
        if (freq < 45) return 'EI';
        if (freq < 60) return '2HUMP_EI';
        return '3HUMP_EI';
    }

    function findPeaks(freqs, psd, maxPeaks) {
        const peaks = [];
        for (let i = 1; i < psd.length - 1; i++) {
            if (psd[i] > psd[i - 1] && psd[i] >= psd[i + 1] && psd[i] > 0) {
                peaks.push({ freq: freqs[i], amp: psd[i] });
            }
        }
        peaks.sort((a, b) => b.amp - a.amp);
        return peaks.slice(0, maxPeaks || 3).sort((a, b) => a.freq - b.freq);
    }

    function processAxis(data, tableId, axisLabel) {
        const tableEl = document.getElementById(tableId);

        // Detección real de picos (locales, no solo el máximo global)
        const peaks = findPeaks(data.freq, data.psd, 3);
        let peakFreq = 0;
        let maxVal = 0;
        for (let i = 0; i < data.psd.length; i++) {
            if (data.psd[i] > maxVal) {
                maxVal = data.psd[i];
                peakFreq = data.freq[i];
            }
        }
        if (peaks.length) peakFreq = peaks[0].freq;

        const recommended = recommendShaper(peakFreq);
        const info = SHAPER_INFO[recommended] || SHAPER_INFO.MZV;
        const order = ['ZV', 'MZV', 'EI', '2HUMP_EI', '3HUMP_EI'];

        let html = `
            <div class="shaper-recommendation" style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 12px; margin-bottom: 1rem;">
                <p style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; margin-bottom:0.3rem;">${t.recommendedShaper}</p>
                <p style="font-size: 1.1rem; font-weight: bold; color: var(--primary-light); margin-bottom:0.35rem;">shaper_type_${axisLabel.toLowerCase()}: ${recommended.toLowerCase()}</p>
                <p style="font-size: 1.1rem; font-weight: bold; color: var(--primary-light); margin-bottom:0.4rem;">shaper_freq_${axisLabel.toLowerCase()}: ${peakFreq.toFixed(1)}</p>
                <p style="font-size:0.78rem;color:var(--text-muted);margin:0;">${info.note}</p>
            </div>
            <div style="margin-bottom:0.8rem;font-size:0.8rem;">
                <span style="color:var(--text-muted);">${t.shaperPeaks}:</span>
                ${peaks.map(p => `<span style="font-family:var(--font-mono);margin-left:0.4rem;">${p.freq.toFixed(1)} Hz</span>`).join('') || '<span style="color:var(--text-muted);">—</span>'}
            </div>
            <table style="width: 100%; font-size: 0.85rem; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">
                        <th style="padding: 0.5rem; text-align: left;">${t.shaperType}</th>
                        <th style="padding: 0.5rem; text-align: left;">${t.shaperUseWhen}</th>
                        <th style="padding: 0.5rem; text-align: right;">${t.shaperSmoothing}</th>
                    </tr>
                </thead>
                <tbody>
        `;

        order.forEach(type => {
            const s = SHAPER_INFO[type];
            const isRec = type === recommended;
            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);${isRec ? 'background:rgba(34,197,94,0.08);' : ''}">
                    <td style="padding: 0.6rem 0.5rem;">${isRec ? '★ ' : ''}${type}</td>
                    <td style="padding: 0.6rem 0.5rem; color: var(--text-muted); font-size: 0.78rem;">${s.use}</td>
                    <td style="padding: 0.6rem 0.5rem; text-align: right;">${s.smooth}</td>
                </tr>
            `;
        });

        html += `</tbody></table>
            <p style="font-size:0.72rem;color:var(--text-muted);margin-top:0.7rem;">
                ${t.shaperValidate}
            </p>`;
        tableEl.innerHTML = html;

        return { type: recommended, freq: peakFreq, peaks: peaks };
    }

    // Initialize Icons
    if (window.lucide) window.lucide.createIcons();
};
