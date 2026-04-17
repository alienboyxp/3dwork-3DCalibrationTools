window.renderHome = function (container, t) {
    const MARLIN_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Marlin_logo.svg';
    const KLIPPER_LOGO = 'https://raw.githubusercontent.com/Klipper3d/klipper/master/docs/img/klipper.svg';

    container.innerHTML = `
        <div class="home-container">
            <div class="home-header">
                <h1>${t.homeTitle}</h1>
                <p>${t.homeDesc}</p>
            </div>

            <div class="tool-grid">
                <!-- ROW 1: LITHOPHANE & HUEFORGE (50/50 Split) -->
                <a href="3d-tools/index.html#litho" class="tool-card" id="card-lithophane" style="grid-column: span 2; border-color: rgba(255,120,0,0.3); background: linear-gradient(135deg, rgba(255,120,0,0.08) 0%, var(--bg-card) 100%);">
                    <div class="badge-container">
                        <span class="badge" style="background:rgba(255,120,0,0.15);color:#FF9A3C;border:1px solid rgba(255,120,0,0.3);">NEW</span>
                    </div>
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

                <a href="3d-tools/index.html#hue" class="tool-card" id="card-hueforge" style="grid-column: span 2; border-color: rgba(59,130,246,0.3); background: linear-gradient(135deg, rgba(59,130,246,0.08) 0%, var(--bg-card) 100%);">
                    <div class="badge-container">
                        <span class="badge" style="background:rgba(59,130,246,0.15);color:#93C5FD;border:1px solid rgba(59,130,246,0.3);">LABS</span>
                    </div>
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon" style="background: rgba(59,130,246,0.12); color: #93C5FD;">
                                <i data-lucide="palette"></i>
                            </div>
                            <h3 style="margin: 0;">${t.hueforgeTitle}</h3>
                        </div>
                        <p style="margin: 0;">${t.hueforgeSummary}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="arrow-right"></i>
                    </div>
                </a>

                <!-- ROW 2: CALIBRATION TOOLS -->
                <a href="#esteps" class="tool-card" id="card-esteps">
                    <div class="badge-container">
                        <span class="badge badge-marlin"><img src="${MARLIN_LOGO}" class="badge-logo"> Marlin</span>
                        <span class="badge badge-klipper"><img src="${KLIPPER_LOGO}" class="badge-logo"> Klipper</span>
                    </div>
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon">
                                <i data-lucide="gauge"></i>
                            </div>
                            <h3 style="margin: 0;">${t.esteps}</h3>
                        </div>
                        <p style="margin: 0;">${t.estepsSummary}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="chevron-right"></i>
                    </div>
                </a>

                <a href="#rotation" class="tool-card" id="card-rotation">
                    <div class="badge-container">
                        <span class="badge badge-klipper"><img src="${KLIPPER_LOGO}" class="badge-logo"> Klipper</span>
                    </div>
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon">
                                <i data-lucide="refresh-cw"></i>
                            </div>
                            <h3 style="margin: 0;">${t.rotation}</h3>
                        </div>
                        <p style="margin: 0;">${t.rotationSummary}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="chevron-right"></i>
                    </div>
                </a>

                <a href="#skew" class="tool-card" id="card-skew">
                    <div class="badge-container">
                        <span class="badge badge-marlin"><img src="${MARLIN_LOGO}" class="badge-logo"> Marlin</span>
                        <span class="badge badge-klipper"><img src="${KLIPPER_LOGO}" class="badge-logo"> Klipper</span>
                    </div>
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon">
                                <i data-lucide="box"></i>
                            </div>
                            <h3 style="margin: 0;">${t.skew}</h3>
                        </div>
                        <p style="margin: 0;">${t.skewSummary}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="arrow-right"></i>
                    </div>
                </a>

                <a href="#bedmesh" class="tool-card" id="card-bedmesh">
                    <div class="badge-container">
                        <span class="badge badge-klipper"><img src="${KLIPPER_LOGO}" class="badge-logo"> Klipper</span>
                    </div>
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon">
                                <i data-lucide="grid-3x3"></i>
                            </div>
                            <h3 style="margin: 0;">${t.bedMeshTitle}</h3>
                        </div>
                        <p style="margin: 0;">${t.bedMeshSummary}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="chevron-right"></i>
                    </div>
                </a>

                <!-- ROW 3: ADVANCED TOOLS -->
                <a href="#bedleveling" class="tool-card" id="card-bedleveling">
                    <div class="badge-container">
                        <span class="badge badge-klipper"><img src="${KLIPPER_LOGO}" class="badge-logo"> Klipper</span>
                    </div>
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon">
                                <i data-lucide="wrench"></i>
                            </div>
                            <h3 style="margin: 0;">${t.manualLevelingTitle}</h3>
                        </div>
                        <p style="margin: 0;">${t.manualLevelingSummary}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="chevron-right"></i>
                    </div>
                </a>

                <a href="#vref" class="tool-card" id="card-vref">
                    <div class="badge-container">
                        <span class="badge badge-marlin"><img src="${MARLIN_LOGO}" class="badge-logo"> Marlin</span>
                        <span class="badge badge-klipper"><img src="${KLIPPER_LOGO}" class="badge-logo"> Klipper</span>
                    </div>
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon">
                                <i data-lucide="zap"></i>
                            </div>
                            <h3 style="margin: 0;">${t.vrefTitle}</h3>
                        </div>
                        <p style="margin: 0;">${t.vrefSummary}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="chevron-right"></i>
                    </div>
                </a>

                <a href="#shaper" class="tool-card" id="card-shaper">
                    <div class="badge-container">
                        <span class="badge badge-klipper"><img src="${KLIPPER_LOGO}" class="badge-logo"> Klipper</span>
                    </div>
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon">
                                <i data-lucide="activity"></i>
                            </div>
                            <h3 style="margin: 0;">${t.shaperTitle}</h3>
                        </div>
                        <p style="margin: 0;">${t.shaperSummary}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="chevron-right"></i>
                    </div>
                </a>

                <a href="#loganalyzer" class="tool-card" id="card-loganalyzer">
                    <div class="badge-container">
                        <span class="badge badge-klipper"><img src="${KLIPPER_LOGO}" class="badge-logo"> Klipper</span>
                    </div>
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon">
                                <i data-lucide="file-search"></i>
                            </div>
                            <h3 style="margin: 0;">${t.logAnalyzerTitle}</h3>
                        </div>
                        <p style="margin: 0;">${t.logAnalyzerSummary}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="chevron-right"></i>
                    </div>
                </a>

                <!-- ROW 4: PRICE CALCULATOR (Full Width) -->
                <a href="#price" class="tool-card col-span-full" id="card-price">
                    <div class="tool-info">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="tool-icon">
                                <i data-lucide="calculator"></i>
                            </div>
                            <h3 style="margin: 0;">${t.priceCalculator}</h3>
                        </div>
                        <p style="margin: 0;">${t.priceSummary}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="chevron-right"></i>
                    </div>
                </a>
                <!-- COMPARATOR CARD -->
                <a href="#comparator" class="tool-card" id="card-comparator" style="grid-column: span 2; border-color: rgba(16,185,129,0.3); background: linear-gradient(135deg, rgba(16,185,129,0.08) 0%, var(--bg-card) 100%);">
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

            </div>
        </div>
    `;

    if (window.lucide) {
        window.lucide.createIcons();
    }
};
