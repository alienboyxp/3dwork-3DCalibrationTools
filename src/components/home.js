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
            </div>
        </div>
    `;

    if (window.lucide) {
        window.lucide.createIcons();
    }
};
