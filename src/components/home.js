window.renderHome = function (container, t) {
    container.innerHTML = `
        <div class="home-container">
            <div class="home-header">
                <h1>${t.homeTitle}</h1>
                <p>${t.homeDesc}</p>
            </div>

            <div class="tool-grid">
                <a href="#esteps" class="tool-card" id="card-esteps">
                    <div class="tool-icon">
                        <i data-lucide="gauge"></i>
                    </div>
                    <div class="tool-info">
                        <h3>${t.esteps}</h3>
                        <p>${t.estepsSummary}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="chevron-right"></i>
                    </div>
                </a>

                <a href="#rotation" class="tool-card" id="card-rotation">
                    <div class="tool-icon">
                        <i data-lucide="refresh-cw"></i>
                    </div>
                    <div class="tool-info">
                        <h3>${t.rotation}</h3>
                        <p>${t.rotationSummary}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="chevron-right"></i>
                    </div>
                </a>

                <a href="#skew" class="tool-card" id="card-skew">
                    <div class="tool-icon">
                        <i data-lucide="box"></i>
                    </div>
                    <div class="tool-info">
                        <h3>${t.skew}</h3>
                        <p>${t.skewSummary}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="arrow-right"></i>
                    </div>
                </a>

                <a href="#bedmesh" class="tool-card" id="card-bedmesh">
                    <div class="tool-icon">
                        <i data-lucide="grid-3x3"></i>
                    </div>
                    <div class="tool-info">
                        <h3>${t.bedMeshTitle}</h3>
                        <p>${t.bedMeshSummary}</p>
                    </div>
                    <div class="tool-action">
                        <i data-lucide="chevron-right"></i>
                    </div>
                </a>

                <a href="#price" class="tool-card col-span-full" id="card-price">
                    <div class="tool-icon">
                        <i data-lucide="calculator"></i>
                    </div>
                    <div class="tool-info">
                        <h3>${t.priceCalculator}</h3>
                        <p>${t.priceSummary}</p>
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

    // Add click events for local navigation if needed, 
    // but main.js should handle hashchanges.
};
