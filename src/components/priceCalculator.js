window.renderPriceCalculator = function (container, t) {
    container.innerHTML = `
        <div class="card price-calculator">
            <h2><i data-lucide="calculator"></i> ${t.priceCalculator}</h2>
            
            <div class="calc-section">
                <h3><i data-lucide="printer"></i> ${t.printerSettings}</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label>${t.printerPower}</label>
                        <input type="number" id="printer-power" value="250" step="5">
                    </div>
                </div>
            </div>

            <div class="calc-section">
                <h3><i data-lucide="file-text"></i> ${t.printInfo}</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label>${t.printTime}</label>
                        <input type="number" id="print-time" value="1" step="0.1">
                    </div>
                    <div class="form-group">
                        <label>${t.quantity}</label>
                        <input type="number" id="quantity" value="1" step="1">
                    </div>
                    <div class="form-group">
                        <label>${t.failureRate}</label>
                        <input type="number" id="failure-rate" value="5" step="1">
                    </div>
                </div>
            </div>

            <div class="calc-section">
                <h3><i data-lucide="package"></i> ${t.materials}</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label>${t.materialWeight}</label>
                        <input type="number" id="material-weight" value="50" step="1">
                    </div>
                    <div class="form-group">
                        <label>${t.materialCost}</label>
                        <input type="number" id="material-cost" value="20" step="0.1">
                    </div>
                </div>
            </div>

            <div class="calc-section">
                <h3><i data-lucide="briefcase"></i> ${t.overhead}</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label>${t.electricityCost}</label>
                        <input type="number" id="electricity-cost" value="0.25" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>${t.laborRate}</label>
                        <input type="number" id="labor-rate" value="15" step="0.5">
                    </div>
                    <div class="form-group">
                        <label>${t.laborHours}</label>
                        <input type="number" id="labor-hours" value="0.5" step="0.1">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>${t.packagingCost}</label>
                        <input type="number" id="packaging-cost" value="0" step="0.1">
                    </div>
                    <div class="form-group">
                        <label>${t.shippingCost}</label>
                        <input type="number" id="shipping-cost" value="0" step="0.1">
                    </div>
                </div>
            </div>

            <div class="calc-section">
                <h3><i data-lucide="trending-up"></i> ${t.margin}</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label>${t.margin}</label>
                        <input type="number" id="profit-margin" value="15" step="1">
                    </div>
                </div>
            </div>

            <div class="result-area price-results">
                <div class="result-grid">
                    <div class="result-item">
                        <span>${t.totalCost}:</span>
                        <span class="result-value" id="base-cost">-</span>
                    </div>
                    <div class="result-item main-result">
                        <span>${t.finalPrice}:</span>
                        <span class="result-value highlight" id="final-price">-</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    const inputIds = [
        'printer-power', 'print-time', 'quantity', 'failure-rate',
        'material-weight', 'material-cost', 'electricity-cost',
        'labor-rate', 'labor-hours', 'packaging-cost', 'shipping-cost', 'profit-margin'
    ];

    function calculate() {
        const power = parseFloat(document.getElementById('printer-power').value) || 0;
        const time = parseFloat(document.getElementById('print-time').value) || 0;
        const qty = parseFloat(document.getElementById('quantity').value) || 1;
        const failure = parseFloat(document.getElementById('failure-rate').value) || 0;
        const weight = parseFloat(document.getElementById('material-weight').value) || 0;
        const matCost = parseFloat(document.getElementById('material-cost').value) || 0;
        const elecCost = parseFloat(document.getElementById('electricity-cost').value) || 0;
        const laborRate = parseFloat(document.getElementById('labor-rate').value) || 0;
        const laborHours = parseFloat(document.getElementById('labor-hours').value) || 0;
        const packCost = parseFloat(document.getElementById('packaging-cost').value) || 0;
        const shipCost = parseFloat(document.getElementById('shipping-cost').value) || 0;
        const margin = parseFloat(document.getElementById('profit-margin').value) || 0;

        const fm = 1 + (failure / 100);
        const mc = (weight / 1000) * matCost * fm * qty;
        const ec = (power / 1000) * time * elecCost * fm * qty;
        const lc = laborRate * laborHours * fm * qty;
        const pc = packCost * qty;
        const sc = shipCost * qty;

        const baseCost = mc + ec + lc + pc + sc;
        const finalPrice = baseCost * (1 + (margin / 100));

        const baseCostEl = document.getElementById('base-cost');
        const finalPriceEl = document.getElementById('final-price');

        if (baseCostEl) baseCostEl.textContent = baseCost.toFixed(2) + ' €';
        if (finalPriceEl) finalPriceEl.textContent = finalPrice.toFixed(2) + ' €';
    }

    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', calculate);
    });

    calculate();
};
