window.renderLogAnalyzer = function (container, t) {
    const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
    const scriptUrl = `${baseUrl}/getlogs.sh`;

    container.innerHTML = `
        <div class="card">
            <div class="card-header" style="border-bottom: 1px solid var(--glass-border); padding-bottom: 1.5rem; margin-bottom: 2rem;">
                <h2 style="margin-bottom: 0.5rem;"><i data-lucide="file-search" style="color: var(--primary-light);"></i> ${t.logAnalyzerTitle}</h2>
                <p>${t.logAnalyzerSummary}</p>
            </div>

            <div class="calculator-grid" style="display: flex; flex-direction: column; gap: 2.5rem;">
                
                <!-- LOG RETRIEVAL OPTIONS -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    <!-- OPTION A: AUTOMATED -->
                    <div class="info-box" style="background: rgba(139, 92, 246, 0.05); border: 1px solid var(--primary); margin: 0; display: flex; flex-direction: column; height: 100%;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3 style="margin: 0; font-size: 1rem; color: var(--primary-light); display: flex; align-items: center; gap: 0.5rem;">
                                <span style="background: var(--primary); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">A</span>
                                ${t.optionA}
                            </h3>
                            <span class="badge badge-klipper" style="font-size: 0.7rem;">${t.recommended}</span>
                        </div>
                        <p style="font-size: 0.85rem; margin-bottom: 1.5rem; color: var(--text-muted); flex-grow: 1;">
                            ${t.logRetrieveDesc}
                        </p>
                        <div style="background: rgba(0,0,0,0.4); padding: 1rem; border-radius: 12px; font-family: monospace; font-size: 0.75rem; border: 1px solid rgba(255,255,255,0.05);">
                            <code style="word-break: break-all; color: var(--primary-light);">curl -sSL ${scriptUrl} | bash</code>
                            <button id="btn-copy-cmd" class="btn-secondary" style="width: 100%; margin-top: 0.75rem; padding: 0.4rem; font-size: 0.7rem; justify-content: center;">
                                <i data-lucide="copy" style="width: 14px; height: 14px;"></i> ${t.logCommand}
                            </button>
                        </div>
                    </div>

                    <!-- OPTION B: MANUAL -->
                    <div class="info-box" style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--glass-border); margin: 0; display: flex; flex-direction: column; height: 100%;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3 style="margin: 0; font-size: 1rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem;">
                                <span style="background: var(--glass-border); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">B</span>
                                ${t.optionB}
                            </h3>
                        </div>
                        <p style="font-size: 0.85rem; margin-bottom: 1rem; color: var(--text-muted); flex-grow: 1;">
                            ${t.logUploadDesc}
                        </p>
                        <div style="font-size: 0.8rem; color: var(--text-muted); padding-left: 1rem; border-left: 2px solid var(--glass-border);">
                            <p style="margin-bottom: 0.4rem;">${t.mainsailManual}</p>
                            <p style="margin-bottom: 0.4rem;">${t.fluiddManual}</p>
                        </div>
                        <button id="btn-load-demo-log" class="btn-secondary" style="margin-top: auto; padding: 0.5rem; font-size: 0.75rem; justify-content: center; width: 100%;">
                            <i data-lucide="play-circle"></i> ${t.loadDemo}
                        </button>
                    </div>
                </div>

                <!-- UPLOAD ZONE -->
                <div id="upload-container">
                    <div class="upload-zone" id="log-drop-zone" style="height: 140px; border-style: dashed; background: rgba(139, 92, 246, 0.02);">
                        <i data-lucide="upload-cloud" style="width: 40px; height: 40px; margin-bottom: 0.5rem; color: var(--primary-light);"></i>
                        <p style="margin-bottom: 0.5rem;">${t.logDropZone}</p>
                        <p style="font-size: 0.75rem; color: var(--text-muted);">Accepted: .log, .tar.gz, .zip</p>
                        <span class="file-name" id="log-file-name" style="font-weight: bold; color: var(--primary-light); margin-top: 0.5rem;"></span>
                        <input type="file" id="log-input" accept=".log,.txt,.gz,.zip,.tgz,.tar.gz" style="display: none;">
                    </div>
                </div>

                <!-- ANALYSIS DASHBOARD (Initially Hidden) -->
                <div id="log-results" style="display: none; flex-direction: column; gap: 2rem;">
                    
                    <!-- 1. AI STEP-BY-STEP DIAGNOSTICS (PRIORITY) -->
                    <div id="ai-section" class="result-card" style="background: linear-gradient(145deg, rgba(139, 92, 246, 0.15), rgba(16, 185, 129, 0.05)); border: 1px solid var(--primary-light); padding: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <h3 style="display: flex; align-items: center; gap: 0.6rem; color: var(--primary-light); margin: 0; font-size: 1.2rem;">
                                <i data-lucide="sparkles" style="width: 24px; height: 24px;"></i> ${t.aiAnalysisTitle}
                            </h3>
                            <div id="ai-status" style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem;">
                                <span class="pulse" style="width: 8px; height: 8px; background: var(--secondary); border-radius: 50%;"></span> ${t.analyzing}
                            </div>
                        </div>
                        
                        <div id="ai-response-container" style="display: flex; flex-direction: column; gap: 1.5rem;">
                            <div id="ai-loading" style="text-align: center; padding: 2rem;">
                                <div class="spinner" style="width: 32px; height: 32px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--primary-light); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                                <p style="font-size: 0.9rem; color: var(--text-muted);">${t.analyzing}</p>
                            </div>
                            <div id="ai-content" style="display: none; flex-direction: column; gap: 1.5rem;">
                                <!-- AI Content will be injected here -->
                            </div>
                        </div>

                        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">Accuracy: Heuristic-High | Model: KlipperTech-v2</p>
                            <button id="btn-ai-prompt" class="btn-secondary" style="font-size: 0.75rem; padding: 0.4rem 0.8rem;">
                                <i data-lucide="copy"></i> ${t.copyPrompt}
                            </button>
                        </div>
                    </div>

                    <!-- 2. DATA TABS -->
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <div class="tabs" style="justify-content: flex-start; margin: 0; border-bottom: 1px solid var(--glass-border); overflow-x: auto;">
                            <button class="tab-btn active" id="tab-summary"><i data-lucide="layout-dashboard"></i> Overview</button>
                            <button class="tab-btn" id="tab-graphs"><i data-lucide="activity"></i> ${t.graphsTitle}</button>
                            <button class="tab-btn" id="tab-debug"><i data-lucide="cpu"></i> ${t.systemStats}</button>
                            <button class="tab-btn" id="tab-config"><i data-lucide="file-code"></i> Configuration</button>
                            <button class="tab-btn" id="tab-logs"><i data-lucide="file-text"></i> Logs</button>
                        </div>

                        <!-- TAB: OVERVIEW -->
                        <div id="content-summary" class="tab-pane active" style="display: flex; flex-direction: column; gap: 1.5rem;">
                            <!-- Top Summary Cards -->
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                                <div class="result-card" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.05);">
                                    <h4 style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Host OS</h4>
                                    <p id="sum-os" style="margin-top: 0.5rem; font-weight: bold;">--</p>
                                </div>
                                <div class="result-card" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.05);">
                                    <h4 style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Klipper Version</h4>
                                    <p id="sum-klipper" style="margin-top: 0.5rem; font-family: monospace; font-size: 0.85rem;">--</p>
                                </div>
                                <div class="result-card" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.05);">
                                    <h4 style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">${t.connectivityIssues}</h4>
                                    <p id="sum-mcu" style="margin-top: 0.5rem; font-weight: bold;">--</p>
                                </div>
                            </div>

                            <div class="result-card" style="background: rgba(244, 63, 94, 0.05); border-color: rgba(244, 63, 94, 0.2);">
                                <h3 style="margin-bottom: 1rem; color: #FDA4AF; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                                    <i data-lucide="alert-circle" style="width: 18px; height: 18px;"></i> ${t.detectedErrors}
                                </h3>
                                <div id="error-list" style="font-family: monospace; font-size: 0.8rem; line-height: 1.5;"></div>
                            </div>
                        </div>

                        <!-- TAB: GRAPHS (New) -->
                        <div id="content-graphs" class="tab-pane" style="display: none; flex-direction: column; gap: 1.5rem;">
                            <!-- Session Selector -->
                            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); padding: 1rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem;">
                                <label style="font-size: 0.85rem; color: var(--text-muted);">${t.sessionSelector}:</label>
                                <select id="session-select" style="background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); color: white; padding: 0.5rem; border-radius: 8px; flex-grow: 1; font-family: monospace; font-size: 0.85rem;">
                                    <option value="">Loading logs...</option>
                                </select>
                            </div>

                            <!-- Charts -->
                            <div style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 12px; border: 1px solid var(--glass-border); position: relative; height: 300px;">
                                <h4 style="margin-bottom: 1rem; color: var(--primary-light); font-size: 0.9rem;">${t.temperatureGraph}</h4>
                                <canvas id="chart-temp" style="width: 100%; height: 100%;"></canvas>
                            </div>
                            
                            <div style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 12px; border: 1px solid var(--glass-border); position: relative; height: 300px;">
                                <h4 style="margin-bottom: 1rem; color: var(--secondary); font-size: 0.9rem;">${t.loadGraph}</h4>
                                <canvas id="chart-load" style="width: 100%; height: 100%;"></canvas>
                            </div>
                        </div>

                        <!-- TAB: SYSTEM INFO (Accordions) -->
                        <div id="content-debug" class="tab-pane" style="display: none; flex-direction: column; gap: 1rem;">
                            <div id="debug-info-container" style="display: flex; flex-direction: column; gap: 0.75rem;">
                                <!-- Accordions go here -->
                            </div>
                        </div>

                        <!-- TAB: CONFIGURATION -->
                        <div id="content-config" class="tab-pane" style="display: none; flex-direction: column; gap: 1rem;">
                            <div style="background: rgba(0,0,0,0.3); border-radius: 12px; border: 1px solid var(--glass-border); overflow: hidden;">
                                <div style="padding: 1rem; background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-family: monospace; font-size: 0.85rem; color: var(--primary-light);">printer.cfg (Extracted)</span>
                                    <button class="btn-secondary" style="font-size: 0.7rem; padding: 0.3rem 0.6rem;" onclick="copyConfig()">Copy Config</button>
                                </div>
                                <pre id="config-view" style="padding: 1.5rem; font-size: 0.8rem; max-height: 500px; overflow: auto; color: #94a3b8;"></pre>
                            </div>
                        </div>

                        <!-- TAB: RAW LOGS -->
                        <div id="content-logs" class="tab-pane" style="display: none; flex-direction: column; gap: 1rem;">
                            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
                                <button class="btn-secondary active" id="btn-log-klippy" style="font-size: 0.7rem; padding: 0.3rem 0.6rem;">klippy.log</button>
                                <button class="btn-secondary" id="btn-log-moonraker" style="font-size: 0.7rem; padding: 0.3rem 0.6rem;">moonraker.log</button>
                                <button class="btn-secondary" id="btn-log-dmesg" style="font-size: 0.7rem; padding: 0.3rem 0.6rem;">dmesg.txt</button>
                                <button class="btn-secondary" id="btn-log-debug" style="font-size: 0.7rem; padding: 0.3rem 0.6rem;">debug.txt</button>
                            </div>
                            <pre id="raw-log-view" style="background: rgba(0,0,0,0.4); padding: 1.5rem; border-radius: 12px; font-size: 0.75rem; max-height: 600px; overflow: auto; border: 1px solid var(--glass-border);"></pre>
                        </div>
                    </div>
                </div>

                <div id="no-log-msg" class="info-box" style="text-align: center; padding: 4rem;">
                    <i data-lucide="file-question" style="width: 56px; height: 56px; margin-bottom: 1.5rem; opacity: 0.2;"></i>
                    <p style="color: var(--text-muted);">${t.noLogData}</p>
                </div>

            </div>
        </div>

        <style>
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .badge-klipper { background: rgba(139, 92, 246, 0.2); color: var(--primary-light); border: 1px solid var(--primary); padding: 2px 8px; border-radius: 12px; }
            .pulse { animation: pulse 2s infinite; }
            @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
            .ai-step-card { background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); border-radius: 16px; padding: 1.25rem; transition: transform 0.2s; }
            .ai-step-card:hover { transform: translateY(-2px); border-color: var(--primary-light); }
            .accordion-trigger:hover { background: rgba(255,255,255,0.06) !important; color: white !important; }
        </style>
    `;

    // Elements
    const dropZone = document.getElementById('log-drop-zone');
    const input = document.getElementById('log-input');
    const btnCopy = document.getElementById('btn-copy-cmd');
    const btnAiPrompt = document.getElementById('btn-ai-prompt');
    const btnDemo = document.getElementById('btn-load-demo-log');
    const fileName = document.getElementById('log-file-name');
    const resultsContainer = document.getElementById('log-results');
    const noLogMsg = document.getElementById('no-log-msg');
    const sessionSelect = document.getElementById('session-select');

    // AI Section Elements
    const aiLoading = document.getElementById('ai-loading');
    const aiContent = document.getElementById('ai-content');

    // Chart instances
    let tempChart = null;
    let loadChart = null;

    // Tabs
    const tabObjects = [
        { btn: document.getElementById('tab-summary'), pane: document.getElementById('content-summary') },
        { btn: document.getElementById('tab-graphs'), pane: document.getElementById('content-graphs') },
        { btn: document.getElementById('tab-debug'), pane: document.getElementById('content-debug') },
        { btn: document.getElementById('tab-config'), pane: document.getElementById('content-config') },
        { btn: document.getElementById('tab-logs'), pane: document.getElementById('content-logs') }
    ];

    tabObjects.forEach(tab => {
        tab.btn.onclick = () => {
            tabObjects.forEach(t => {
                t.btn.classList.remove('active');
                t.pane.style.display = 'none';
            });
            tab.btn.classList.add('active');
            tab.pane.style.display = 'flex';
        };
    });

    // Log Tab Buttons
    const btnLogKlippy = document.getElementById('btn-log-klippy');
    const btnLogMoonraker = document.getElementById('btn-log-moonraker');
    const btnLogDmesg = document.getElementById('btn-log-dmesg');
    const btnLogDebug = document.getElementById('btn-log-debug');
    const rawLogView = document.getElementById('raw-log-view');
    const logBtns = [btnLogKlippy, btnLogMoonraker, btnLogDmesg, btnLogDebug];

    let currentLogData = { klippy: "", moonraker: "", dmesg: "", debug: "" };

    function setActiveLog(btn, content) {
        logBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        rawLogView.textContent = content || "No content found for this log.";
    }

    btnLogKlippy.onclick = () => setActiveLog(btnLogKlippy, currentLogData.klippy);
    btnLogMoonraker.onclick = () => setActiveLog(btnLogMoonraker, currentLogData.moonraker);
    btnLogDmesg.onclick = () => setActiveLog(btnLogDmesg, currentLogData.dmesg);
    btnLogDebug.onclick = () => setActiveLog(btnLogDebug, currentLogData.debug);

    // Copy Command
    btnCopy.onclick = () => {
        const cmd = `curl -sSL ${scriptUrl} | bash`;
        navigator.clipboard.writeText(cmd).then(() => {
            const originalText = btnCopy.innerHTML;
            btnCopy.innerHTML = `<i data-lucide="check"></i> Copied!`;
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => {
                btnCopy.innerHTML = originalText;
                if (window.lucide) window.lucide.createIcons();
            }, 2000);
        });
    };

    // Upload Setup
    dropZone.onclick = () => input.click();
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('active'); };
    dropZone.ondragleave = () => dropZone.classList.remove('active');
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    };
    input.onchange = (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    };

    window.copyConfig = () => {
        const cfg = document.getElementById('config-view').textContent;
        navigator.clipboard.writeText(cfg).then(() => alert('Configuration copied!'));
    };

    // DEMO DATA
    btnDemo.onclick = () => {
        fileName.textContent = 'CODeRUS_Example_Data.tar.gz';
        try {
            if (typeof window.demoLogData === 'undefined') {
                throw new Error("Demo data script not loaded.");
            }
            const { klippy, moonraker, dmesg, debug } = window.demoLogData;
            processLogData({
                klippy: klippy,
                moonraker: moonraker,
                debug: `>>> dmesg (Kernel Logs)\n${dmesg}\n\n${debug}`,
                rawDmesg: dmesg,
                rawDebug: debug
            });
        } catch (error) {
            console.error("Error loading demo assets:", error);
            alert(`Error loading demo data: ${error.message}`);
        }
    };

    function handleFile(file) {
        fileName.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            if (content.includes('>>> lsb_release')) {
                processLogData({ debug: content, klippy: "Log binary or text provided." });
            } else if (file.name.includes('moonraker')) {
                processLogData({ moonraker: content, klippy: "Upload klippy.log for full analysis." });
            } else {
                processLogData({ klippy: content });
            }
        };
        reader.readAsText(file);
    }

    function processLogData(data) {
        noLogMsg.style.display = 'none';
        resultsContainer.style.display = 'flex';
        aiLoading.style.display = 'block';
        aiContent.style.display = 'none';

        currentLogData.klippy = data.klippy || "";
        currentLogData.moonraker = data.moonraker || "";
        currentLogData.dmesg = data.rawDmesg || "";
        currentLogData.debug = data.rawDebug || "";

        // 1. Initial Parsing
        const kversion = currentLogData.klippy.match(/v\d+\.\d+\.\d+-\d+-\w+/) || ["Unknown"];
        document.getElementById('sum-klipper').textContent = kversion[0];

        // MCU Status
        const mcuFail = currentLogData.klippy.includes('mcu \'\')') || currentLogData.klippy.includes('Unable to open serial port');
        document.getElementById('sum-mcu').textContent = mcuFail ? "🔴 Disconnected / Port Error" : "🟢 Connected";
        document.getElementById('sum-mcu').style.color = mcuFail ? "var(--secondary)" : "var(--primary-light)";

        // OS Detection
        if (data.debug) {
            const osMatch = data.debug.match(/Description:\s+([^\n]+)/);
            document.getElementById('sum-os').textContent = osMatch ? osMatch[1] : "Linux (Detected)";
        } else {
            document.getElementById('sum-os').textContent = "Unknown (Upload Debug Info)";
        }

        // 2. Error Extraction
        const errors = [];
        currentLogData.klippy.split('\n').forEach(line => {
            if (line.includes('!!') || (line.toLowerCase().includes('error') && !line.includes('stats:')) || line.includes('Unable to open serial')) {
                errors.push(line.trim());
            }
        });
        document.getElementById('error-list').innerHTML = errors.length > 0
            ? errors.slice(-10).map(e => `<div style="margin-bottom: 0.5rem; color: #FDA4AF; padding-left: 0.5rem; border-left: 2px solid var(--secondary);">${e}</div>`).join('')
            : '<p style="color: var(--text-muted);">No critical errors found.</p>';

        // 3. Process Sessions & Graphs
        const sessions = parseSessions(currentLogData.klippy);
        populateSessionSelect(sessions, currentLogData.klippy);

        // 4. Debug Accordions
        const debugCont = document.getElementById('debug-info-container');
        if (data.debug) {
            const sections = data.debug.split('>>>').filter(s => s.trim());
            debugCont.innerHTML = sections.map(s => {
                const lines = s.trim().split('\n');
                const rawTitle = lines[0].trim();
                const content = lines.slice(1).join('\n').trim();
                return `
                    <div style="background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid var(--glass-border); overflow: hidden;">
                        <button class="accordion-trigger" style="width: 100%; text-align: left; padding: 1rem; background: transparent; border: none; cursor: pointer; display: flex; justify-content: space-between;">
                            <span style="color: var(--primary-light); font-family: monospace; font-weight: bold;">${rawTitle}</span>
                            <i data-lucide="chevron-down"></i>
                        </button>
                        <pre class="accordion-content" style="display: none; padding: 1rem; margin: 0; font-size: 0.75rem; background: rgba(0,0,0,0.3); color: #cbd5e1;">${content}</pre>
                    </div>`;
            }).join('');

            // Re-attach listeners
            debugCont.querySelectorAll('.accordion-trigger').forEach(btn => {
                btn.onclick = () => {
                    const content = btn.nextElementSibling;
                    const icon = btn.querySelector('i');
                    const isOpen = content.style.display === 'block';
                    content.style.display = isOpen ? 'none' : 'block';
                    icon.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
                };
            });
        }

        // 5. Config Extraction
        extractConfig(currentLogData.klippy);

        // 6. Default Logs View
        setActiveLog(btnLogKlippy, currentLogData.klippy);

        // 7. AI Trigger
        setTimeout(() => runAiAnalysis(data, errors, kversion[0]), 1200);

        if (window.lucide) window.lucide.createIcons();
    }

    function parseSessions(logText) {
        const lines = logText.split('\n');
        const sessionStarts = [];
        lines.forEach((line, index) => {
            if (line.includes('Starting Klippy...')) {
                // Try extracting timestamp
                const dateMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
                sessionStarts.push({
                    index: index,
                    timestamp: dateMatch ? dateMatch[1] : `Session #${sessionStarts.length + 1}`
                });
            }
        });

        // Add EOF as last end
        const sessions = [];
        for (let i = 0; i < sessionStarts.length; i++) {
            sessions.push({
                label: sessionStarts[i].timestamp,
                start: sessionStarts[i].index,
                end: sessionStarts[i + 1] ? sessionStarts[i + 1].index : lines.length
            });
        }

        // If no explicit starts, assume 1 giant session
        if (sessions.length === 0) sessions.push({ label: "Full Log", start: 0, end: lines.length });

        return sessions.reverse(); // Newest first
    }

    function populateSessionSelect(sessions, logText) {
        sessionSelect.innerHTML = '';

        // Add "All Sessions" option
        const allOpt = document.createElement('option');
        allOpt.value = 'all';
        allOpt.textContent = `All Sessions (${sessions.length})`;
        sessionSelect.appendChild(allOpt);

        sessions.forEach((s, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = `${s.label} (${s.end - s.start} lines)`;
            sessionSelect.appendChild(opt);
        });

        sessionSelect.onchange = () => {
            const val = sessionSelect.value;
            let linesToRender;
            if (val === 'all') {
                linesToRender = logText.split('\n');
            } else {
                const s = sessions[parseInt(val)];
                linesToRender = logText.split('\n').slice(s.start, s.end);
            }
            updateGraphs(linesToRender);
        };

        // Load first session by default
        if (sessions.length > 0) {
            const s = sessions[0];
            updateGraphs(logText.split('\n').slice(s.start, s.end));
            sessionSelect.value = 0;
        } else {
            updateGraphs(logText.split('\n'));
            sessionSelect.value = 'all';
        }
    }

    function updateGraphs(lines) {
        // destroy old charts
        if (tempChart) tempChart.destroy();
        if (loadChart) loadChart.destroy();
        // Remove old comm chart to reset state/canvas
        const commContainer = document.getElementById('comm-chart-container');
        if (commContainer) commContainer.remove();

        // 1. Data Structures for parsing
        const times = [];
        const datasets = {
            temps: { extruder: [], bed: [], host: [], mcus: {} },
            load: { mcu: {}, host: [], awake: {} },
            bandwidth: {},
            comm: { ready: {}, retransmit: {}, invalid: {} },
            freq: { mcu: {}, host: [] }
        };
        const events = [];

        let startTime = 0;
        let lastTime = 0;

        // 2. Parse Loop
        lines.forEach(line => {
            // 2a. Events
            if (line.includes('Starting Klippy') || line.includes('FIRMWARE_RESTART')) {
                if (lastTime > 0) events.push({ time: lastTime, type: 'start', label: 'Start' });
            } else if (line.includes('Transition to shutdown state') || line.includes('MCU error')) {
                events.push({ time: lastTime, type: 'error', label: 'Shutdown/Error' });
            }

            // 2b. Stats
            // Format: Stats 123.45: key=val ...
            if (line.includes('Stats ')) {
                const timeMatch = line.match(/Stats (\d+\.\d+):/);
                if (timeMatch) {
                    const t = parseFloat(timeMatch[1]);
                    if (startTime === 0) startTime = t;
                    const relTime = parseFloat((t - startTime).toFixed(1));
                    lastTime = relTime;

                    // Store time once
                    times.push(relTime);

                    // --- Temps ---
                    const bedMatch = line.match(/heater_bed: target=\d+ temp=(\d+\.\d+)/);
                    const extMatch = line.match(/extruder: target=\d+ temp=(\d+\.\d+)/);

                    datasets.temps.bed.push(bedMatch ? parseFloat(bedMatch[1]) : null);
                    datasets.temps.extruder.push(extMatch ? parseFloat(extMatch[1]) : null);

                    // Parse generic sensors, including host and mcu temps
                    // Regex for top-level temp sensors "temp_sensor <name>: target=... temp=..."
                    const tempSensorRegex = /temp_sensor (\w+): target=\d+ temp=(\d+\.\d+)/g;
                    let tMatch;
                    while ((tMatch = tempSensorRegex.exec(line)) !== null) {
                        const name = tMatch[1];
                        const val = parseFloat(tMatch[2]);
                        if (name.includes('host') || name.includes('pi')) {
                            datasets.temps.host.push(val);
                        } else {
                            if (!datasets.temps.mcus[name]) datasets.temps.mcus[name] = [];
                            datasets.temps.mcus[name].push(val);
                        }
                    }
                    // Fill holes for host if regex didn't hit this line but we are pushing other data
                    if (datasets.temps.host.length < times.length) datasets.temps.host.push(null);


                    // Host Load
                    const hostLoadMatch = line.match(/sysload=(\d+\.\d+)/);
                    datasets.load.host.push(hostLoadMatch ? parseFloat(hostLoadMatch[1]) : null);

                    // --- DYNAMIC MCU PARSING ---
                    // Finds: "mcu: ... rpi: ..."
                    const sections = line.split(/\s(?=\w+:)/);

                    sections.forEach(section => {
                        const colonIdx = section.indexOf(':');
                        if (colonIdx === -1) return;

                        const name = section.substring(0, colonIdx).trim();
                        const content = section.substring(colonIdx + 1);

                        // Ignore heaters
                        if (name.startsWith('heater') || name === 'extruder' || name.startsWith('temp_sensor')) return;

                        const getVal = (k) => {
                            const m = content.match(new RegExp(`${k}=(\\d+\\.?\\d*)`));
                            return m ? parseFloat(m[1]) : null;
                        };

                        // MCU Task/Awake
                        const task = getVal('mcu_task');
                        const awake = getVal('mcu_awake');
                        if (task !== null) {
                            if (!datasets.load.mcu[name]) datasets.load.mcu[name] = [];
                            datasets.load.mcu[name].push(task * 100);

                            if (!datasets.load.awake[name]) datasets.load.awake[name] = [];
                            datasets.load.awake[name].push(awake * 100);
                        }

                        // MCU Temp (inside mcu block as temp=45.0)
                        const internalTemp = getVal('temp');
                        if (internalTemp !== null) {
                            if (!datasets.temps.mcus[name]) datasets.temps.mcus[name] = [];
                            datasets.temps.mcus[name].push(internalTemp);
                        }


                        // ... existing parsing loop ...
                        // Comm
                        const ready = getVal('ready_bytes');
                        const retransmit = getVal('bytes_retransmit');
                        const invalid = getVal('bytes_invalid');

                        if (ready !== null) {
                            if (!datasets.comm.ready[name]) datasets.comm.ready[name] = [];
                            datasets.comm.ready[name].push(ready);
                        }
                        if (retransmit !== null) {
                            if (!datasets.comm.retransmit[name]) datasets.comm.retransmit[name] = [];
                            datasets.comm.retransmit[name].push(retransmit);
                        }
                        if (invalid !== null) {
                            if (!datasets.comm.invalid[name]) datasets.comm.invalid[name] = [];
                            datasets.comm.invalid[name].push(invalid);
                        }
                    });
                }
            }
        });

        // 3. Construct Charts
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { labels: { color: '#cbd5e1' } },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#fff',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: { ticks: { color: '#64748b' }, grid: { color: '#334155' } },
                y: { ticks: { color: '#64748b' }, grid: { color: '#334155' } }
            }
        };

        const eventPlugin = {
            id: 'eventLines',
            beforeDraw: (chart) => {
                const ctx = chart.ctx;
                const xAxis = chart.scales.x;
                const yAxis = chart.scales.y;

                events.forEach(ev => {
                    const x = xAxis.getPixelForValue(ev.time);
                    if (x < xAxis.left || x > xAxis.right) return;

                    ctx.save();
                    ctx.beginPath();
                    ctx.fillStyle = ev.type === 'start' ? '#10b981' : '#ef4444';
                    ctx.font = '10px sans-serif';
                    ctx.fillText(ev.label, x + 4, yAxis.top + 10);

                    ctx.moveTo(x, yAxis.top);
                    ctx.lineTo(x, yAxis.bottom);
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = ev.type === 'start' ? '#10b981' : '#ef4444';
                    ctx.setLineDash([5, 5]);
                    ctx.stroke();
                    ctx.restore();
                });
            }
        };

        // --- CHART 1: TEMPERATURES ---
        const tempDatasets = [
            { label: 'Bed', data: datasets.temps.bed, borderColor: '#3b82f6', borderWidth: 1, pointRadius: 0 },
            { label: 'Extruder', data: datasets.temps.extruder, borderColor: '#ef4444', borderWidth: 1, pointRadius: 0 }
        ];

        if (datasets.temps.host.some(v => v !== null)) {
            tempDatasets.push({ label: 'Host', data: datasets.temps.host, borderColor: '#a855f7', borderWidth: 1, pointRadius: 0, borderDash: [5, 5] });
        }

        // Add MCU Temps
        Object.keys(datasets.temps.mcus).forEach((mcu, idx) => {
            const colors = ['#10b981', '#f59e0b', '#ec4899'];
            const color = colors[idx % colors.length];
            tempDatasets.push({ label: `${mcu} Temp`, data: datasets.temps.mcus[mcu], borderColor: color, borderWidth: 1, pointRadius: 0 });
        });

        new Chart(document.getElementById('chart-temp').getContext('2d'), {
            type: 'line',
            data: { labels: times, datasets: tempDatasets },
            options: { ...commonOptions },
            plugins: [eventPlugin]
        });

        // --- CHART 2: SYSTEM LOAD ---
        const loadDatasets = [
            { label: 'Host Load', data: datasets.load.host, borderColor: '#a855f7', borderWidth: 2, pointRadius: 0, yAxisID: 'y' }
        ];

        Object.keys(datasets.load.mcu).forEach((mcu, idx) => {
            const colors = ['#10b981', '#f59e0b', '#3b82f6'];
            const color = colors[idx % colors.length];
            loadDatasets.push({
                label: `${mcu} Load %`,
                data: datasets.load.mcu[mcu],
                borderColor: color,
                borderWidth: 1,
                pointRadius: 0,
                yAxisID: 'y1'
            });
            loadDatasets.push({
                label: `${mcu} Awake %`,
                data: datasets.load.awake[mcu],
                borderColor: color,
                borderWidth: 1,
                borderDash: [2, 2],
                pointRadius: 0,
                yAxisID: 'y1'
            });
        });

        new Chart(document.getElementById('chart-load').getContext('2d'), {
            type: 'line',
            data: { labels: times, datasets: loadDatasets },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    y: { ...commonOptions.scales.y, title: { display: true, text: 'Host Load' } },
                    y1: {
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#64748b' },
                        title: { display: true, text: 'MCU Usage (%)' }
                    }
                }
            },
            plugins: [eventPlugin]
        });

        // --- CHART 3: COMMUNICATIONS ---
        // Dynamically create this canvas if it doesn't exist
        const graphsDiv = document.getElementById('content-graphs');
        if (!document.getElementById('chart-comm')) {
            const div = document.createElement('div');
            div.id = 'comm-chart-container';
            div.style.cssText = "background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 12px; border: 1px solid var(--glass-border); position: relative; height: 300px; margin-top: 20px;";
            div.innerHTML = `<h4 style="margin-bottom: 1rem; color: #f59e0b; font-size: 0.9rem;">MCU Communications</h4><canvas id="chart-comm" style="width: 100%; height: 100%;"></canvas>`;
            graphsDiv.appendChild(div);
        }

        const commDatasets = [];
        const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

        Object.keys(datasets.comm.ready).forEach((mcu, idx) => {
            const color = colors[idx % colors.length];

            // Ready Bytes
            commDatasets.push({
                label: `${mcu} Ready`,
                data: datasets.comm.ready[mcu],
                borderColor: color,
                backgroundColor: color.replace(')', ', 0.1)').replace('rgb', 'rgba'),
                borderWidth: 1,
                pointRadius: 0,
                fill: false,
                yAxisID: 'y'
            });

            // Retransmit (only if non-zero exists)
            if (datasets.comm.retransmit[mcu] && datasets.comm.retransmit[mcu].some(v => v > 0)) {
                commDatasets.push({
                    label: `${mcu} Retransmit`,
                    data: datasets.comm.retransmit[mcu],
                    borderColor: '#ef4444', // Red for errors
                    borderWidth: 1,
                    borderDash: [2, 2],
                    pointRadius: 0,
                    yAxisID: 'y1'
                });
            }

            // Invalid (only if non-zero exists)
            if (datasets.comm.invalid[mcu] && datasets.comm.invalid[mcu].some(v => v > 0)) {
                commDatasets.push({
                    label: `${mcu} Invalid`,
                    data: datasets.comm.invalid[mcu],
                    borderColor: '#f97316', // Orange for invalid
                    borderWidth: 1,
                    borderDash: [4, 4],
                    pointRadius: 0,
                    yAxisID: 'y1'
                });
            }
        });

        if (document.getElementById('chart-comm')) {
            new Chart(document.getElementById('chart-comm').getContext('2d'), {
                type: 'line',
                data: { labels: times, datasets: commDatasets },
                options: {
                    ...commonOptions,
                    scales: {
                        ...commonOptions.scales,
                        y: { ...commonOptions.scales.y, title: { display: true, text: 'Bytes' } },
                        y1: {
                            position: 'right',
                            grid: { drawOnChartArea: false },
                            ticks: { color: '#ef4444' },
                            title: { display: true, text: 'Errors' },
                            min: 0 // Errors start at 0
                        }
                    }
                },
                plugins: [eventPlugin]
            });
        }
    }

    function extractConfig(logText) {
        const configView = document.getElementById('config-view');
        // Find the LAST occurrence of the config header
        const configHeader = "===== Config file";
        const lastHeaderIdx = logText.lastIndexOf(configHeader);

        if (lastHeaderIdx !== -1) {
            const contentAfterHeader = logText.substring(lastHeaderIdx);
            const endMarker = "=======================";
            const endMarkerIdx = contentAfterHeader.indexOf(endMarker);

            if (endMarkerIdx !== -1) {
                const firstLineEnd = contentAfterHeader.indexOf('\n');
                if (firstLineEnd !== -1 && firstLineEnd < endMarkerIdx) {
                    configView.textContent = contentAfterHeader.substring(firstLineEnd + 1, endMarkerIdx).trim();
                } else {
                    configView.textContent = "Found config block but could not parse structure.";
                }
            } else {
                configView.textContent = contentAfterHeader.substring(contentAfterHeader.indexOf('\n') + 1).trim();
            }
        } else {
            configView.textContent = "Could not find configuration block in klippy.log. Ensure the log includes a full Klipper restart.";
        }
    }

    function runAiAnalysis(data, errors, version) {
        aiLoading.style.display = 'none';
        aiContent.style.display = 'flex';

        let reportTitle = "System Health Optimal";
        let recommendationHtml = `<p>No critical failures detected. Ensure your firmware version (${version}) matches your Klipper host installation for continued stability.</p>`;

        if (errors.some(e => e.includes('Unable to open serial port'))) {
            reportTitle = "Critical Failure: MCU Communication Lost";
            recommendationHtml = `
                <div class="ai-step-card">
                    <h4 style="color: white; margin-bottom: 0.5rem;"><i data-lucide="search" style="width: 16px; color: var(--primary-light);"></i> Core Fault</h4>
                    <p style="font-size: 0.85rem; color: #94a3b8;">The host OS cannot find the serial device defined in your configuration. This is usually hardware-related.</p>
                </div>
                <div class="ai-step-card" style="border-left: 4px solid var(--primary);">
                    <h4 style="color: white; margin-bottom: 0.5rem;"><i data-lucide="wrench" style="width: 16px; color: var(--primary-light);"></i> Resolution Steps</h4>
                    <ul style="font-size: 0.85rem; color: #cbd5e1; padding-left: 1.2rem; display: flex; flex-direction: column; gap: 0.5rem;">
                        <li><strong>Check USB Link:</strong> Replace the USB cable. Klipper is sensitive to high-resistance cables.</li>
                        <li><strong>ID Verification:</strong> Check the <em>System Environment</em> tab under <code>find /dev/serial</code>. If the list is empty, the MCU is not powered or the bootloader is stuck.</li>
                    </ul>
                </div>
            `;
        } else if (currentLogData.klippy.includes('Timer too close')) {
            reportTitle = "Performance Alert: Processing Bottleneck";
            recommendationHtml = `
                    <div class="ai-step-card">
                        <h4 style="color: white; margin-bottom: 0.5rem;"><i data-lucide="activity" style="width: 16px; color: #fbbf24;"></i> Diagnosis</h4>
                        <p style="font-size: 0.85rem; color: #94a3b8;">Klipper failed to send commands to the MCU in time. This points to high CPU load or too many microsteps for the MCU's frequency.</p>
                    </div>
                `;
        }

        aiContent.innerHTML = `
            <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 12px; border-left: 4px solid var(--primary); margin-bottom: 1rem;">
                <h4 style="color: white; margin: 0; font-size: 1rem;">${reportTitle}</h4>
            </div>
            ${recommendationHtml}
        `;

        btnAiPrompt.onclick = () => {
            const prompt = `EXPERT KLIPPER ANALYSIS REQUEST
Logs: ${currentLogData.klippy.slice(-2000)}
Errors: ${errors.join('\n')}
Analyze these logs and provide a technician-level resolution guide.`;
            navigator.clipboard.writeText(prompt).then(() => alert('AI Prompt Copied!'));
        };

        if (window.lucide) window.lucide.createIcons();
    }

    if (window.lucide) window.lucide.createIcons();
};
