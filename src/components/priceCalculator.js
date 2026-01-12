window.renderPriceCalculator = function (container, t) {
    // Override the default content max-width for the calculator
    container.style.maxWidth = '100%';
    container.style.width = '100%';

    container.innerHTML = `
        <div style="padding: 0; overflow: hidden; height: calc(100vh - 160px); min-height: 800px; width: 100%;">
            <iframe 
                src="3dcalculator/index.html" 
                style="width: 100%; height: 100%; border: none; display: block;"
                title="3D Printing Cost Calculator"
            ></iframe>
        </div>
    `;
};
