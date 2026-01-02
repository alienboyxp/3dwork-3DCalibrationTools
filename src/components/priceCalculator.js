window.renderPriceCalculator = function (container, t) {
    const printers = [
        { name: "Custom", cost: 0, lifespan: 2000, power: 350, maint: 5 },
        { name: "Creality Ender 3 V2", cost: 250, lifespan: 2000, power: 350, maint: 10 },
        { name: "Creality Ender 3 S1", cost: 380, lifespan: 2500, power: 350, maint: 8 },
        { name: "Prusa MK4", cost: 1199, lifespan: 8000, power: 150, maint: 2 },
        { name: "Prusa Mini+", cost: 459, lifespan: 5000, power: 120, maint: 3 },
        { name: "Bambu Lab X1C", cost: 1499, lifespan: 5000, power: 350, maint: 5 },
        { name: "Bambu Lab P1P", cost: 699, lifespan: 5000, power: 300, maint: 5 },
        { name: "Voron 2.4 (Kit)", cost: 1200, lifespan: 6000, power: 450, maint: 15 },
        { name: "Elegoo Neptune 4", cost: 280, lifespan: 2000, power: 300, maint: 8 }
    ];

    const materials = ["Custom", "PLA", "PETG", "ABS", "ASA", "TPU", "PA (Nylon)", "PC", "PVA", "HIPS"];

    container.innerHTML = `
        <div class="card price-calculator">
            
            <!-- Header with Toggle View Mode -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem;">
                 <h2><i data-lucide="calculator"></i> ${t.priceCalculator}</h2>
                 <button id="btn-toggle-quote" class="btn-primary" style="display:none;">
                    <i data-lucide="file-text"></i> ${t.generateQuote}
                 </button>
                 <button id="btn-toggle-calc" class="btn-secondary" style="display:none;">
                    <i data-lucide="arrow-left"></i> ${t.backToCalculator}
                 </button>
            </div>
            
            <!-- CALCULATOR VIEW -->
            <div id="calculator-view">
                <div class="calendar-layout" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                    
                    <!-- Left Column: Inputs -->
                    <div class="calc-inputs-section">
                        

                        <!-- Overheads -->
                        <div class="calc-section">
                            <h3><i data-lucide="coins"></i> ${t.overhead}</h3>
                            <div class="form-row">
                                <div class="input-group">
                                    <label>${t.laborRate}</label>
                                    <input type="number" id="labor-rate" placeholder="15.00" step="0.01">
                                </div>
                                <div class="input-group">
                                    <label>${t.electricityRate}</label>
                                    <input type="number" id="electricity-rate" placeholder="0.15" step="0.001">
                                </div>
                            </div>
                             <div class="form-row">
                                 <div class="input-group">
                                    <label>${t.failureRate}</label>
                                    <input type="number" id="failure-rate" placeholder="10" step="0.1">
                                </div>
                                <div class="input-group">
                                    <label>${t.markup}</label>
                                    <input type="number" id="markup" placeholder="30" step="0.1">
                                </div>
                                <div class="input-group">
                                    <label>${t.taxRate}</label>
                                    <input type="number" id="tax-rate" placeholder="21" step="0.1">
                                </div>
                            </div>
                        </div>

                        <!-- Business Settings (Collapsible) -->
                        <div class="calc-section" style="border-left: 4px solid var(--secondary);">
                             <div id="biz-settings-header" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                                <h3 style="margin:0;"><i data-lucide="briefcase"></i> ${t.businessSettings}</h3>
                                <i data-lucide="chevron-down" id="biz-toggle-icon"></i>
                             </div>
                             <div id="biz-settings-content" style="display:none; margin-top: 1rem;">
                                 <div class="form-row">
                                    <div class="input-group">
                                        <label>${t.companyName}</label>
                                        <input type="text" id="biz-name" placeholder="My 3D Print Shop">
                                    </div>
                                    <div class="input-group">
                                        <label>${t.companyEmail}</label>
                                        <input type="text" id="biz-email" placeholder="contact@example.com">
                                    </div>
                                </div>
                                 <div class="form-row">
                                    <div class="input-group">
                                        <label>${t.companyWebsite}</label>
                                        <input type="text" id="biz-web" placeholder="www.example.com">
                                    </div>
                                     <div class="input-group">
                                        <label>${t.quoteNumber}</label>
                                        <input type="text" id="biz-quote-num" placeholder="001">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="input-group">
                                        <label>${t.currencySymbol}</label>
                                        <input type="text" id="biz-currency" placeholder="€" value="€" style="width: 60px;">
                                    </div>
                                     <div class="input-group">
                                        <label>${t.customerName}</label>
                                        <input type="text" id="biz-customer" placeholder="John Doe">
                                    </div>
                                </div>
                             </div>
                        </div>

                        <button id="btn-reset" class="btn-secondary" style="margin-top:20px; width:100%;"><i data-lucide="rotate-ccw"></i> ${t.reset}</button>

                    </div>

                    <!-- Right Column: Results -->
                    <div class="calc-results-section">
                         <div class="result-area" style="position: sticky; top: 120px;">
                            <h3><i data-lucide="pie-chart"></i> ${t.costBreakdown}</h3>
                            
                            <div class="result-item">
                                <span>${t.materials}</span>
                                <span id="res-material">€0.00</span>
                            </div>
                             <div class="result-item">
                                <span>${t.laborCost}</span>
                                <span id="res-labor">€0.00</span>
                            </div>
                            <div class="result-item">
                                <span>${t.energyCost}</span>
                                <span id="res-energy">€0.00</span>
                            </div>
                             <div class="result-item">
                                <span>${t.depreciationCost}</span>
                                <span id="res-depreciation">€0.00</span>
                            </div>
                            <div class="result-item">
                                <span>${t.maintenanceCost}</span>
                                <span id="res-maintenance">€0.00</span>
                            </div>
                             <div class="result-item" style="border-top:1px solid rgba(255,255,255,0.1); padding-top:10px; margin-top:10px;">
                                <span>${t.failureRate} Cost</span>
                                <span id="res-failure">€0.00</span>
                            </div>
                            
                             <div class="result-item" style="margin-top:20px; font-weight:bold;">
                                <span>${t.subtotal}</span>
                                <span id="res-subtotal">€0.00</span>
                            </div>
                             <div class="result-item">
                                <span>${t.profit} (${t.markup})</span>
                                <span id="res-profit" style="color:var(--secondary);">€0.00</span>
                            </div>
                             <div class="result-item">
                                <span>${t.taxAmount} (${t.taxRate})</span>
                                <span id="res-tax">€0.00</span>
                            </div>

                            <div class="result-item main-result">
                                <span>${t.totalPrice}</span>
                                <span id="res-total" class="result-value highlight">€0.00</span>
                                <span style="font-size:0.8em; opacity:0.7;">${t.perUnit}: <span id="res-per-unit">€0.00</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- QUOTE VIEW (Hidden by default) -->
            <div id="quote-view" style="display:none; max-width: 800px; margin: 0 auto; background: white; color: #1f2937; padding: 40px; border-radius: 8px;">
                <!-- Quote content driven by JS -->
                <div style="display:flex; justify-content:space-between; margin-bottom: 40px;">
                    <div>
                        <h1 style="margin:0; font-size: 2em; color: #1f2937;">${t.quoteTitle}</h1>
                        <p style="margin:5px 0 0 0; color: #6b7280; font-size: 0.9em;">#<span id="quote-num-disp"></span></p>
                    </div>
                    <div style="text-align:right;">
                        <h2 id="quote-company-name" style="margin:0; font-size: 1.2em;"></h2>
                        <p id="quote-company-email" style="margin:2px 0; font-size: 0.9em;"></p>
                        <p id="quote-company-web" style="margin:2px 0; font-size: 0.9em;"></p>
                    </div>
                </div>

                <div style="margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
                     <p style="font-weight:bold; margin-bottom:5px;">${t.preparedFor}:</p>
                     <h3 id="quote-customer" style="margin:0;"></h3>
                     <p style="margin-top:5px; font-size:0.9em; color:#6b7280;">${new Date().toLocaleDateString()}</p>
                </div>

                <div style="margin-bottom: 40px;">
                    <table style="width:100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 2px solid #374151; text-align:left;">
                                <th style="padding: 10px 0;">${t.printName}</th>
                                <th style="padding: 10px 0;">${t.quantity}</th>
                                <th style="padding: 10px 0; text-align:right;">${t.perUnit}</th>
                                <th style="padding: 10px 0; text-align:right;">${t.total}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td id="quote-item-name" style="padding: 15px 0;"></td>
                                <td id="quote-item-qty" style="padding: 15px 0;"></td>
                                <td id="quote-item-price" style="padding: 15px 0; text-align:right;"></td>
                                <td id="quote-item-total" style="padding: 15px 0; text-align:right; font-weight:bold;"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="text-align:right; margin-top: 40px;">
                     <p style="font-size: 1.5em; font-weight: bold; color: #1f2937;">${t.totalPrice}: <span id="quote-final-total"></span></p>
                     <p style="font-size: 0.8em; color: #6b7280; margin-top: 10px;">${t.validity}</p>
                </div>

                <!-- Print button only visible in this view -->
                <div class="no-print" style="margin-top:40px; text-align:center;">
                     <button onclick="window.print()" style="padding: 10px 20px; background: #374151; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        <i data-lucide="printer"></i> Print Quote
                     </button>
                </div>
            </div>

        </div>

    `;

    // --- Dynamic Material Rows ---
    const materialsContainer = document.getElementById('materials-container');
    const existingMaterials = [];

    function addMaterialRow() {
        const id = Date.now();
        const row = document.createElement('div');
        row.className = 'material-row';
        row.style.cssText = `
            background: rgba(255,255,255,0.03); 
            border: 1px solid var(--glass-border); 
            border-radius: 12px; 
            padding: 1rem; 
            margin-bottom: 1rem; 
            position: relative;
        `;
        row.dataset.rowId = id;

        row.innerHTML = `
            <div class="form-row" style="margin-bottom: 1rem;">
                <div class="input-group">
                    <label>${t.materialType}</label>
                    <select class="mat-type">
                        ${materials.map(m => `<option value="${m}">${m}</option>`).join('')}
                    </select>
                </div>
                <div class="input-group">
                    <label>${t.color}</label>
                    <input type="text" class="mat-color" placeholder="e.g. Red">
                </div>
                ${materialsContainer.children.length > 0 ? `
                <button class="btn-remove-material" style="background:none; border:none; color: #ef4444; cursor:pointer; padding: 0.5rem; display:flex; align-items:flex-end; padding-bottom: 1rem;">
                    <i data-lucide="trash-2"></i>
                </button>` : ''} 
            </div>
            <div class="form-row" style="margin-bottom: 0;">
                <div class="input-group">
                    <label>${t.materialCost}</label>
                    <input type="number" class="mat-cost" placeholder="20.00" step="0.01">
                </div>
                <div class="input-group">
                    <label>${t.materialSpoolWeight}</label>
                    <input type="number" class="mat-spool" placeholder="1000" step="1">
                </div>
                <div class="input-group">
                    <label>${t.materialUsedWeight}</label>
                    <input type="number" class="mat-used" placeholder="0" step="0.01">
                </div>
            </div>
        `;

        materialsContainer.appendChild(row);

        // Add remove listener
        const removeBtn = row.querySelector('.btn-remove-material');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                row.remove();
                calculate();
            });
        }

        // Add listeners to new inputs
        row.querySelectorAll('input, select').forEach(inp => {
            inp.addEventListener('input', calculate);
        });

        if (window.lucide) window.lucide.createIcons();
        calculate();
    }

    // Add initial row
    addMaterialRow();

    document.getElementById('btn-add-material').addEventListener('click', addMaterialRow);


    // --- Calculation Logic ---

    // Printer Auto-fill
    const select = document.getElementById('printer-select');
    select.addEventListener('change', (e) => {
        const selected = printers.find(p => p.name === e.target.value);
        if (selected && selected.name !== 'Custom') {
            document.getElementById('printer-cost').value = selected.cost;
            document.getElementById('printer-lifespan').value = selected.lifespan;
            document.getElementById('printer-power').value = selected.power;
            document.getElementById('printer-maintenance').value = selected.maint;
        }
        calculate();
    });

    const staticInputs = container.querySelectorAll('.calc-inputs-section > .calc-section input, .calc-inputs-section > .calc-section select');
    staticInputs.forEach(input => input.addEventListener('input', calculate));

    // Global result vars for quote view
    let globalTotal = 0;
    let globalPerUnit = 0;
    let globalCurrency = '€';

    function calculate() {
        // Business
        globalCurrency = document.getElementById('biz-currency').value || '€';

        // Printer
        const pCost = parseFloat(document.getElementById('printer-cost').value) || 0;
        const pLifespan = parseFloat(document.getElementById('printer-lifespan').value) || 1;
        const pPower = parseFloat(document.getElementById('printer-power').value) || 0;
        const pMaint = parseFloat(document.getElementById('printer-maintenance').value) || 0;

        // Print
        const pTime = parseFloat(document.getElementById('print-time').value) || 0;
        const qty = parseFloat(document.getElementById('quantity').value) || 1;
        const prep = parseFloat(document.getElementById('prep-time').value) || 0;
        const post = parseFloat(document.getElementById('post-time').value) || 0;

        // Rates
        const lRate = parseFloat(document.getElementById('labor-rate').value) || 0;
        const eRate = parseFloat(document.getElementById('electricity-rate').value) || 0;
        const failRate = parseFloat(document.getElementById('failure-rate').value) || 0;
        const markup = parseFloat(document.getElementById('markup').value) || 0;
        const tax = parseFloat(document.getElementById('tax-rate').value) || 0;

        // --- Material Loop ---
        let totalMaterialCost = 0;
        let totalWeight = 0;

        const matRows = document.querySelectorAll('.material-row');
        matRows.forEach(row => {
            const cost = parseFloat(row.querySelector('.mat-cost').value) || 0;
            const spool = parseFloat(row.querySelector('.mat-spool').value) || 1000;
            const usedPerUnit = parseFloat(row.querySelector('.mat-used').value) || 0;
            const usedTotal = usedPerUnit * qty;

            const costForThisMat = (usedTotal / spool) * cost;

            totalMaterialCost += costForThisMat;
            totalWeight += usedTotal;
        });

        document.getElementById('total-print-weight').textContent = totalWeight.toFixed(2) + 'g';

        // --- Core Calculations ---
        const totalTime = pTime * qty;

        // 1. Depreciation
        const depreciation = (pCost / pLifespan) * totalTime;

        // 2. Maintenance
        const maintenance = depreciation * (pMaint / 100);

        // 3. Energy
        const energy = (pPower / 1000) * eRate * totalTime;

        // 4. Labor
        const labor = ((prep + post) * qty) * lRate;

        // --- Subtotals ---
        const baseCost = depreciation + maintenance + energy + totalMaterialCost + labor;

        // 6. Failure
        const failure = baseCost * (failRate / 100);

        const subtotal = baseCost + failure;

        // 7. Profit
        const profitVal = subtotal * (markup / 100);

        // 8. Tax
        const taxable = subtotal + profitVal;
        const taxVal = taxable * (tax / 100);

        const total = taxable + taxVal;
        const perUnit = total / qty;

        globalTotal = total;
        globalPerUnit = perUnit;

        // --- Display ---
        document.getElementById('res-material').textContent = globalCurrency + totalMaterialCost.toFixed(2);
        document.getElementById('res-energy').textContent = globalCurrency + energy.toFixed(2);
        document.getElementById('res-labor').textContent = globalCurrency + labor.toFixed(2);
        document.getElementById('res-depreciation').textContent = globalCurrency + depreciation.toFixed(2);
        document.getElementById('res-maintenance').textContent = globalCurrency + maintenance.toFixed(2);
        document.getElementById('res-failure').textContent = globalCurrency + failure.toFixed(2);

        document.getElementById('res-subtotal').textContent = globalCurrency + subtotal.toFixed(2);
        document.getElementById('res-profit').textContent = globalCurrency + profitVal.toFixed(2);
        document.getElementById('res-tax').textContent = globalCurrency + taxVal.toFixed(2);

        document.getElementById('res-total').textContent = globalCurrency + total.toFixed(2);
        document.getElementById('res-per-unit').textContent = globalCurrency + perUnit.toFixed(2);

        // Show Generate Quote btn if total > 0
        const btnToggle = document.getElementById('btn-toggle-quote');
        const btnToggleBack = document.getElementById('btn-toggle-calc');
        if (total > 0 && btnToggleBack.style.display === 'none') {
            btnToggle.style.display = 'block';
        }
    }

    // Toggle View Logic
    const btnQuote = document.getElementById('btn-toggle-quote');
    const btnCalc = document.getElementById('btn-toggle-calc');
    const viewCalc = document.getElementById('calculator-view');
    const viewQuote = document.getElementById('quote-view');

    btnQuote.addEventListener('click', () => {
        // Populate Quote Data
        document.getElementById('quote-num-disp').textContent = document.getElementById('biz-quote-num').value || '0001';
        document.getElementById('quote-company-name').textContent = document.getElementById('biz-name').value || 'My 3D Print Shop';
        document.getElementById('quote-company-email').textContent = document.getElementById('biz-email').value || '';
        document.getElementById('quote-company-web').textContent = document.getElementById('biz-web').value || '';

        document.getElementById('quote-customer').textContent = document.getElementById('biz-customer').value || 'Valued Customer';

        document.getElementById('quote-item-name').textContent = document.getElementById('print-name').value || '3D Print Job';
        document.getElementById('quote-item-qty').textContent = document.getElementById('quantity').value || '1';
        document.getElementById('quote-item-price').textContent = globalCurrency + globalPerUnit.toFixed(2);
        document.getElementById('quote-item-total').textContent = globalCurrency + globalTotal.toFixed(2);

        document.getElementById('quote-final-total').textContent = globalCurrency + globalTotal.toFixed(2);

        // Toggle Views
        viewCalc.style.display = 'none';
        viewQuote.style.display = 'block';
        btnQuote.style.display = 'none';
        btnCalc.style.display = 'block';

        // Hide card header title in quote view?
    });

    btnCalc.addEventListener('click', () => {
        viewCalc.style.display = 'block'; // grid? No, the inner div is calendar-layout
        viewQuote.style.display = 'none';
        btnQuote.style.display = 'block';
        btnCalc.style.display = 'none';
    });


    // Reset Button
    document.getElementById('btn-reset').addEventListener('click', () => {
        container.querySelectorAll('input').forEach(inp => {
            // Keep business settings? Maybe for session comfort
            if (!inp.id.startsWith('biz') && !inp.classList.contains('mat-used') && !inp.classList.contains('mat-cost')) inp.value = '';
        });
        document.getElementById('printer-select').value = 'Custom';
        document.getElementById('quantity').value = 1;

        const containerMat = document.getElementById('materials-container');
        while (containerMat.children.length > 1) {
            containerMat.lastChild.remove();
        }
        const firstRow = containerMat.firstElementChild;
        if (firstRow) {
            firstRow.querySelectorAll('input').forEach(i => i.value = '');
            firstRow.querySelector('select').selectedIndex = 0;
        }

        calculate();
    });

    // Toggle Business Settings
    const bizHeader = document.getElementById('biz-settings-header');
    const bizContent = document.getElementById('biz-settings-content');
    const bizIcon = document.getElementById('biz-toggle-icon');

    if (bizHeader) {
        bizHeader.addEventListener('click', () => {
            const isHidden = bizContent.style.display === 'none';
            bizContent.style.display = isHidden ? 'block' : 'none';
            bizIcon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        });
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }

};
