window.renderHome = function (container, t) {
    const MARLIN_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Marlin_logo.svg';
    const KLIPPER_LOGO = 'https://raw.githubusercontent.com/Klipper3d/klipper/master/docs/img/klipper.svg';

    container.innerHTML = `
        <div class="home-container">
            <div class="home-header">
                <h1>${t.homeTitle}</h1>
                <p>${t.homeDesc}</p>
            </div>

            <div class="tools-grid">
                <a href="litho.html" class="tool-card" id="card-lithophane" style="border-color: rgba(255,120,0,0.3); background: linear-gradient(135deg, rgba(255,120,0,0.08) 0%, var(--bg-card) 100%);">
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon" style="background: rgba(255,120,0,0.12); color: #FF9A3C;">
                                <i data-lucide="image"></i>
                            </div>
                            <h3 style="margin: 0;">${t.lithophaneTitle}</h3>
                        </div>
                        <p style="margin: 0;">${t.lithophaneSummary}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="arrow-right"></i>
                    </div>
                </a>

                <a href="hueforge.html" class="tool-card" id="card-hueforge" style="border-color: rgba(59,130,246,0.3); background: linear-gradient(135deg, rgba(59,130,246,0.08) 0%, var(--bg-card) 100%);">
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon" style="background: rgba(59,130,246,0.12); color: #34D399;">
                                <i data-lucide="palette"></i>
                            </div>
                            <h3 style="margin: 0;">HueForge Creator</h3>
                        </div>
                        <p style="margin: 0;">${t.hueforgeSummary}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="arrow-right"></i>
                    </div>
                </a>

                <a href="apps/clicker/index.html" class="tool-card" id="card-clicker" style="border-color: rgba(20,184,166,0.3); background: linear-gradient(135deg, rgba(20,184,166,0.08) 0%, var(--bg-card) 100%); position: relative;">
                    <div class="badge-container" style="z-index: 2;">
                        <div class="badge-badge" style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;" onclick="window.location.href='apps/clicker2/index.html'" style="background:#f59e0b;color:#1f2937;font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;font-family:var(--font-display);">
                            <span>BETA</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#f59e0b;"><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                        </span>
                    </div>
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon" style="background: rgba(20,184,166,0.12); color: #5EEAD4;">
                                <i data-lucide="keyboard"></i>
                            </div>
                            <h3 style="margin: 0;">Clicker Factory</h3>
                        </div>
                        <p style="margin: 0;">Turn any image or text into a printable 3D clicker with a real mechanical MX switch.</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="arrow-right"></i>
                    </div>
                </a>

                <a href="#comparator" class="tool-card" id="card-comparator" style="border-color: rgba(16,185,129,0.3); background: linear-gradient(135deg, rgba(16,185,129,0.08) 0%, var(--bg-card) 100%);">
                    <div class="badge-container">
                        <span class="badge" style="background:rgba(16,185,129,0.15);color:#34D399;border:1px solid rgba(16,185,129,0.3);">NEW</span>
                    </div>
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon" style="background: rgba(16,185,129,0.12); color: #34D399;">
                                <i data-lucide="columns-2"></i>
                            </div>
                            <h3 style="margin: 0;">${t.comparatorTitle || 'Comparator'}</h3>
                        </div>
                        <p style="margin: 0;">${t.comparatorSummary || 'Compare 3D printers reviewed by 3Dwork'}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="arrow-right"></i>
                    </div>
                </a>

                <a href="#filaments" class="tool-card" id="card-filaments" style="border-color: rgba(6,182,212,0.3); background: linear-gradient(135deg, rgba(6,182,212,0.08) 0%, var(--bg-card) 100%);">
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon" style="background: rgba(6,182,212,0.12); color: #22D3EE;">
                                <i data-lucide="spool"></i>
                            </div>
                            <h3 style="margin: 0;">${t.filamentsTitle || 'Filaments'}</h3>
                        </div>
                        <p style="margin: 0;">${t.filamentsSummary || 'Compare filament specs and prices'}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="arrow-right"></i>
                    </div>
                </a>

                <a href="#resins" class="tool-card" id="card-resins" style="border-color: rgba(168,85,247,0.3); background: linear-gradient(135deg, rgba(168,85,247,0.08) 0%, var(--bg-card) 100%);">
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon" style="background: rgba(168,85,247,0.12); color: #D8B4FE;">
                                <i data-lucide="droplet"></i>
                            </div>
                            <h3 style="margin: 0;">${t.resinsTitle || 'Resins'}</h3>
                        </div>
                        <p style="margin: 0;">${t.resinsSummary || 'Compare resin prices and types'}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="arrow-right"></i>
                    </div>
                </a>

                <a href="#price" class="tool-card" id="card-price" style="border-color: rgba(239,68,68,0.3); background: linear-gradient(135deg, rgba(239,68,68,0.08) 0%, var(--bg-card) 100%);">
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon" style="background: rgba(239,68,68,0.12); color: #EF4444;">
                                <i data-lucide="calculator"></i>
                            </div>
                            <h3 style="margin: 0;">3D Print Price Calculator</h3>
                        </div>
                        <p style="margin: 0;">${t.priceCalculator}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="arrow-right"></i>
                    </div>
                </a>

                <a href="#esteps" class="tool-card" id="card-esteps" style="border-color: rgba(239,68,68,0.3); background: linear-gradient(135deg, rgba(239,68,68,0.08) 0%, var(--bg-card) 100%);">
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon" style="background: rgba(239,68,68,0.12); color: #EF4444;">
                                <i data-lucide="gear"></i>
                            </div>
                            <h3 style="margin: 0;">E-steps Calculator</h3>
                        </div>
                        <p style="margin: 0;">${t.estepsSummary || 'Calculate E-steps for your extruder.'}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="arrow-right"></i>
                    </div>
                </a>

                <a href="#rotation" class="tool-card" id="card-rotation" style="border-color: rgba(239,68,68,0.3); background: linear-gradient(135deg, rgba(239,68,68,0.08) 0%, var(--bg-card) 100%);">
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon" style="background: rgba(239,68,68,0.12); color: #EF4444;">
                                <i data-lucide="rotate-ccw"></i>
                            </div>
                            <h3 style="margin: 0;">Rotation Distance</h3>
                        </div>
                        <p style="margin: 0;">${t.rotationSummary || 'Calculate rotation distance for your extruder.'}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="arrow-right"></i>
                    </div>
                </a>

                <a href="#skew" class="tool-card" id="card-skew" style="border-color: rgba(239,68,68,0.3); background: linear-gradient(135deg, rgba(239,68,68,0.08) 0%, var(--bg-card) 100%);">
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon" style="background: rgba(239,68,68,0.12); color: #EF4444;">
                                <i data-lucide="rotate-ccw"></i>
                            </div>
                            <h3 style="margin: 0;">Skew Calculator</h3>
                        </div>
                        <p style="margin: 0;">${t.skewSummary || 'Calculate skew correction for your printer.'}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="arrow-right"></i>
                    </div>
                </a>

                <a href="#bedmesh" class="tool-card" id="card-bedmesh" style="border-color: rgba(239,68,68,0.3); background: linear-gradient(135deg, rgba(239,68,68,0.08) 0%, var(--bg-card) 100%);">
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon" style="background: rgba(239,68,68,0.12); color: #EF4444;">
                                <i data-lucide="grid"></i>
                            </div>
                            <h3 style="margin: 0;">Bed Mesh</h3>
                        </div>
                        <p style="margin: 0;">${t.bedMeshSummary || 'Analyze bed mesh data.'}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="arrow-right"></i>
                    </div>
                </a>

                <a href="#bedleveling" class="tool-card" id="card-bedleveling" style="border-color: rgba(239,68,68,0.3); background: linear-gradient(135deg, rgba(239,68,68,0.08) 0%, var(--bg-card) 100%);">
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon" style="background: rgba(239,68,68,0.12); color: #EF4444;">
                                <i data-lucide="level"></i>
                            </div>
                            <h3 style="margin: 0;">Bed Leveling</h3>
                        </div>
                        <p style="margin: 0;">${t.bedLevelingSummary || 'Manual bed leveling assistance.'}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="arrow-right"></i>
                    </div>
                </a>

                <a href="#vref" class="tool-card" id="card-vref" style="border-color: rgba(239,68,68,0.3); background: linear-gradient(135deg, rgba(239,68,68,0.08) 0%, var(--bg-card) 100%);">
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon" style="background: rgba(239,68,68,0.12); color: #EF4444;">
                                <i data-lucide="zap"></i>
                            </div>
                            <h3 style="margin: 0;">Vref Calculator</h3>
                        </div>
                        <p style="margin: 0;">${t.vrefSummary || 'Calculate Vref for stepper drivers.'}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="arrow-right"></i>
                    </div>
                </a>

                <a href="#shaper" class="tool-card" id="card-shaper" style="border-color: rgba(239,68,68,0.3); background: linear-gradient(135deg, rgba(239,68,68,0.08) 0%, var(--bg-card) 100%);">
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon" style="background: rgba(239,68,68,0.12); color: #EF4444;">
                                <i data-lucide="wave"></i>
                            </div>
                            <h3 style="margin: 0;">Input Shaper</h3>
                        </div>
                        <p style="margin: 0;">${t.shaperSummary || 'Calculate Input Shaper values.'}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="arrow-right"></i>
                    </div>
                </a>

                <a href="#loganalyzer" class="tool-card" id="card-loganalyzer" style="border-color: rgba(239,68,68,0.3); background: linear-gradient(135deg, rgba(239,68,68,0.08) 0%, var(--bg-card) 100%);">
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon" style="background: rgba(239,68,68,0.12); color: #EF4444;">
                                <i data-lucide="file-text"></i>
                            </div>
                            <h3 style="margin: 0;">Log Analyzer</h3>
                        </div>
                        <p style="margin: 0;">${t.logAnalyzerSummary || 'Analyze Klipper logs.'}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="arrow-right"></i>
                    </div>
                </a>
            </div>
        </div>`;
};
