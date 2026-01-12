// Global variables will be initialized in initApp

// Initialize the app when the DOM is loaded
window.initApp = function() {
    console.log('App initialized');
    
    try {
        // Initialize DOM elements
        const form = document.getElementById('calculator-form');
        const materialsContainer = document.getElementById('materials-container');
        const addMaterialBtn = document.getElementById('add-material');
        const resetBtn = document.getElementById('reset-btn');
        const calculateBtn = document.getElementById('calculate-btn');
        const exportPdfBtn = document.getElementById('export-pdf-btn');
        const languageToggle = document.getElementById('language-toggle');
        const unitToggle = document.getElementById('unit-toggle');
        const printerSelect = document.getElementById('printer-select');
        const printerPowerInput = document.getElementById('printer-power');
        const printTimeInput = document.getElementById('print-time');
        const quantityInput = document.getElementById('quantity');
        const failureRateInput = document.getElementById('failure-rate');
        const electricityCostInput = document.getElementById('electricity-cost');
        const laborRateInput = document.getElementById('labor-rate');
        const laborHoursInput = document.getElementById('labor-hours');
        const packagingCostInput = document.getElementById('packaging-cost');
        const shippingCostInput = document.getElementById('shipping-cost');
        const totalCostEl = document.getElementById('total-cost');

        // Assign to window object to make them globally available
        window.form = form;
        window.materialsContainer = materialsContainer;
        window.addMaterialBtn = addMaterialBtn;
        window.resetBtn = resetBtn;
        window.calculateBtn = calculateBtn;
        window.exportPdfBtn = exportPdfBtn;
        window.languageToggle = languageToggle;
        window.unitToggle = unitToggle;
        window.printerSelect = printerSelect;
        window.printerPowerInput = printerPowerInput;
        window.printTimeInput = printTimeInput;
        window.quantityInput = quantityInput;
        window.failureRateInput = failureRateInput;
        window.electricityCostInput = electricityCostInput;
        window.laborRateInput = laborRateInput;
        window.laborHoursInput = laborHoursInput;
        window.packagingCostInput = packagingCostInput;
        window.shippingCostInput = shippingCostInput;
        window.totalCostEl = totalCostEl;
        
        // Set up event listeners
        if (typeof setupEventListeners === 'function') {
            setupEventListeners();
        }
        
        // Set default values
        if (printerSelect && !printerSelect.value) {
            printerSelect.value = 'fdm_generic';
        }
        
        // Initial update and calculation
        if (typeof updatePrinterDetails === 'function') {
            updatePrinterDetails();
        }
        
        if (typeof calculateCosts === 'function') {
            calculateCosts();
        }
    } catch (error) {
        console.error('Error initializing app:', error);
    }
};

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// DOM Elements
const form = document.getElementById('calculator-form');
const materialsContainer = document.getElementById('materials-container');
const addMaterialBtn = document.getElementById('add-material');
const calculateBtn = document.getElementById('calculate-btn');
const resetBtn = document.getElementById('reset-btn');
const exportPdfBtn = document.getElementById('export-pdf');
const languageToggle = document.getElementById('language-toggle');
const unitToggle = document.getElementById('unit-toggle');
const printerSelect = document.getElementById('printer-select');
const printerPowerInput = document.getElementById('printer-power');
const printTimeInput = document.getElementById('print-time');
const quantityInput = document.getElementById('quantity');
const failureRateInput = document.getElementById('failure-rate');
const electricityCostInput = document.getElementById('electricity-cost');
const laborCostInput = document.getElementById('labor-cost');
const laborRateInput = document.getElementById('labor-rate');
const laborHoursInput = document.getElementById('labor-hours');
const packagingCostInput = document.getElementById('packaging-cost');
const shippingCostInput = document.getElementById('shipping-cost');
const materialCostEl = document.getElementById('material-cost');
const electricityCostEl = document.getElementById('electricity-cost');
const electricityCostResultEl = document.getElementById('electricity-cost-result');
const laborCostEl = document.getElementById('labor-cost');
const laborCostResultEl = document.getElementById('labor-cost-result');
const packagingCostResultEl = document.getElementById('packaging-cost-result');
const shippingCostResultEl = document.getElementById('shipping-cost-result');
const totalCostEl = document.getElementById('total-cost');

// Update total cost based on selected pricing option
function updateTotalCost() {
    try {
        // Get all individual costs
        const getCost = (id) => {
            const el = document.getElementById(id);
            return el ? parseFloat(el.textContent.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0 : 0;
        };
        
        // Get individual costs
        const materialCost = getCost('material-cost');
        const electricityCost = getCost('electricity-cost-result');
        const laborCost = getCost('labor-cost-result');
        const packagingCost = getCost('packaging-cost-result');
        const shippingCost = getCost('shipping-cost-result');
        
        // Calculate base cost as sum of all individual costs
        const baseCost = materialCost + electricityCost + laborCost + packagingCost + shippingCost;
        
        // Update the base cost display
        const baseCostEl = document.getElementById('base-cost');
        if (baseCostEl) {
            baseCostEl.textContent = `€${baseCost.toFixed(2)}`;
        }
        
        // Get selected pricing option
        const selectedOption = document.querySelector('input[name="pricingOption"]:checked');
        if (!selectedOption) return;
        
        let total = 0;
        let marginPercent = 0;
        const optionId = selectedOption.id.replace('pricing-', '');
        
        // Calculate margin based on selected option
        if (optionId === 'custom') {
            const customMarginInput = document.getElementById('custom-margin');
            marginPercent = customMarginInput ? parseFloat(customMarginInput.value) || 0 : 0;
        } else {
            // Map option IDs to their corresponding margin percentages
            const marginPercentages = {
                'competitive': 10,  // 10%
                'standard': 15,     // 15%
                'urgent': 25,       // 25%
                'crazy': 50         // 50%
            };
            marginPercent = marginPercentages[optionId] || 0;
        }
        
        // Calculate total with margin
        total = baseCost * (1 + (marginPercent / 100));
        
        // Update the total cost display
        const totalCostElement = document.getElementById('total-cost');
        if (totalCostElement) {
            totalCostElement.textContent = `€${total.toFixed(2)}`;
            
            // Update the margin percentage display if it exists
            const marginDisplay = document.getElementById('margin-percentage');
            if (marginDisplay) {
                marginDisplay.textContent = `${marginPercent}%`;
            }
        }
        
        // Update the chart with the new margin
        updateCostAllocationChart(
            materialCost,
            electricityCost,
            laborCost,
            packagingCost,
            shippingCost,
            marginPercent
        );
        
    } catch (error) {
        console.error('Error in updateTotalCost:', error);
    }
}

// Export results as PDF
async function exportToPdf() {
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const originalText = exportPdfBtn ? exportPdfBtn.innerHTML : '';
    let container = null;
    
    try {
        if (exportPdfBtn) {
            exportPdfBtn.disabled = true;
            exportPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Generating...';
        }

        // Get all the necessary elements
        const resultsCard = document.getElementById('results-card');
        const printerSelect = document.getElementById('printer-select');
        const printerName = printerSelect ? printerSelect.options[printerSelect.selectedIndex].text : 'Not specified';
        const printTimeValue = document.getElementById('print-time')?.value || '0';
        const quantityValue = document.getElementById('quantity')?.value || '1';
        
        if (!resultsCard) {
            throw new Error('Could not find results card. Please calculate costs first.');
        }

        // Get PDF settings
        const companyName = document.getElementById('company-name') ? document.getElementById('company-name').value : '3Dwork';
        const companyEmail = document.getElementById('company-email') ? document.getElementById('company-email').value : 'info@3dwork.io';
        const companyWebsite = document.getElementById('company-website') ? document.getElementById('company-website').value : 'https://3dwork.io';
        
        // Get the selected pricing option with margin
        const selectedPricing = document.querySelector('input[name="pricingOption"]:checked');
        let pricingMultiplier = 1.0;
        
        // Get the actual multiplier from the selected pricing option
        if (selectedPricing) {
            const priceElement = selectedPricing.closest('.pricing-option').querySelector('span[id$="-price"]');
            const basePriceElement = document.getElementById('base-cost');
            
            if (priceElement && basePriceElement) {
                const price = parseFloat(priceElement.textContent.replace(/[^0-9.,]/g, '').replace(',', '.'));
                const basePrice = parseFloat(basePriceElement.textContent.replace(/[^0-9.,]/g, '').replace(',', '.'));
                
                if (basePrice > 0) {
                    pricingMultiplier = price / basePrice;
                }
            }
        }
        
        // First, ensure all calculations are up to date
        calculateCosts();
        
        // Get the current cost values from the form
        const getFormCost = (id) => {
            const element = document.getElementById(id);
            if (!element) return 0;
            return parseFloat(element.value) || 0;
        };

        // Get the current values from the form
        const printTimeHours = parseFloat(printTimeValue) || 0;
        const laborRate = parseFloat(document.getElementById('labor-rate')?.value) || 0;
        const electricityRate = parseFloat(document.getElementById('electricity-rate')?.value) || 0;
        const printerPower = parseFloat(document.querySelector('.printer-power')?.value) || 0;
        const quantity = parseInt(quantityValue) || 1;
        const failureRate = parseFloat(document.getElementById('failure-rate')?.value) || 0;
        const failureMultiplier = 1 + (failureRate / 100);

        // Calculate costs directly to ensure accuracy
        const materialCost = Array.from(document.querySelectorAll('.material-row')).reduce((total, row) => {
            const weight = parseFloat(row.querySelector('.material-weight')?.value) || 0;
            const costPerKg = parseFloat(row.querySelector('.material-cost')?.value) || 0;
            return total + ((weight / 1000) * costPerKg);
        }, 0) * failureMultiplier;

        const electricityCost = (printerPower * printTimeHours * electricityRate / 1000) * failureMultiplier;
        const laborCost = (printTimeHours * laborRate) * failureMultiplier;
        const packagingCost = parseFloat(document.getElementById('packaging-cost')?.value) || 0;
        const shippingCost = parseFloat(document.getElementById('shipping-cost')?.value) || 0;

        // Calculate base cost and total with margin
        const baseCost = materialCost + electricityCost + laborCost + packagingCost + shippingCost;
        const totalCost = baseCost * pricingMultiplier;
        const marginAmount = totalCost - baseCost;
        const marginPercentage = (pricingMultiplier - 1) * 100;
        
        // Format currency with proper decimal and thousand separators
        const formatCurrency = (amount) => {
            if (typeof amount !== 'number' || isNaN(amount)) {
                console.warn('Invalid amount for formatting:', amount);
                return '€0,00';
            }
            return '€' + amount.toFixed(2).replace(/\./g, '|')
                                   .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                                   .replace(/\|/g, ',');
        };
        
        // Create a temporary container for the PDF content
        const container = document.createElement('div');
        container.style.width = '800px';
        container.style.padding = '40px';
        container.style.backgroundColor = '#ffffff';
        document.body.appendChild(container);

        // Get current date
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        try {
            // Initialize PDF
            const pdf = new jspdf.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            // Generate professional HTML content for the PDF
            container.innerHTML = `
                <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333; line-height: 1.6;">
                    <!-- Header -->
                    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px;">
                        <h1 style="color: #4f46e5; margin-bottom: 5px;">${companyName || '3D Printing Quote'}</h1>
                        <div style="color: #666; font-size: 0.9em;">
                            <span>${companyEmail} | ${companyWebsite}</span>
                        </div>
                    </div>
                    
                    <!-- Quote Details -->
                    <div style="margin-bottom: 30px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                            <div>
                                <h3 style="color: #4f46e5; margin-bottom: 5px;">Quote #${currentEstimateNumber || '0001'}</h3>
                                <p style="margin: 0; color: #666;">Date: ${formattedDate}</p>
                            </div>
                            <div style="text-align: right;">
                                <p style="margin: 0; color: #666;">Printer: ${printerName}</p>
                                <p style="margin: 0; color: #666;">Quantity: ${quantity} unit(s)</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Cost Breakdown -->
                    <div style="margin-bottom: 30px;">
                        <h3 style="color: #4f46e5; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px;">Cost Breakdown</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Material Cost:</td>
                                <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #eee;">${formatCurrency(materialCost)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Electricity Cost (${printTimeHours}h @ ${printerPower}W):</td>
                                <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #eee;">${formatCurrency(electricityCost)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Labor Cost (${printTimeHours}h @ ${formatCurrency(laborRate)}/h):</td>
                                <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #eee;">${formatCurrency(laborCost)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Packaging Cost:</td>
                                <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #eee;">${formatCurrency(packagingCost)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Shipping Cost:</td>
                                <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #eee;">${formatCurrency(shippingCost)}</td>
                            </tr>
                            <tr style="font-weight: bold;">
                                <td style="padding: 12px 0; border-bottom: 2px solid #4f46e5;">Subtotal:</td>
                                <td style="text-align: right; padding: 12px 0; border-bottom: 2px solid #4f46e5;">${formatCurrency(baseCost)}</td>
                            </tr>
                            ${marginPercentage > 0 ? `
                            <tr>
                                <td style="padding: 8px 0; color: #666;">Margin (${marginPercentage.toFixed(0)}%):</td>
                                <td style="text-align: right; padding: 8px 0; color: #666;">+${formatCurrency(marginAmount)}</td>
                            </tr>
                            ` : ''}
                            <tr style="font-weight: bold; font-size: 1.2em;">
                                <td style="padding: 12px 0; border-top: 2px solid #4f46e5;">Total Cost:</td>
                                <td style="text-align: right; padding: 12px 0; border-top: 2px solid #4f46e5;">${formatCurrency(totalCost)}</td>
                            </tr>
                        </table>
                        ${failureRate > 0 ? `
                        <p style="font-size: 0.9em; color: #666; font-style: italic; margin-top: 5px;">
                            * Includes ${failureRate}% failure rate adjustment
                        </p>
                        ` : ''}
                    </div>
                    
                    <!-- Footer -->
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 0.9em;">
                        <p>Thank you for your business! This quote is valid for 30 days from the date of issue.</p>
                        <p>${companyName} | ${companyEmail} | ${companyWebsite}</p>
                    </div>
                </div>
            `;

            // Use html2canvas to capture the content
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            // Add the image to the PDF
            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // 10mm margin on each side
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            // Add the image to the PDF
            pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);

            // Save the PDF
            pdf.save(`3DPrinting_Quote_${currentEstimateNumber || 'quote'}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF: ' + error.message);
        } finally {
            // Clean up
            if (container && container.parentNode) {
                document.body.removeChild(container);
            }
            
            // Re-enable the export button
            if (exportPdfBtn) {
                exportPdfBtn.disabled = false;
                exportPdfBtn.innerHTML = originalText;
            }
        }
    } catch (error) {
        console.error('Error in exportToPdf:', error);
        alert('Error generating PDF: ' + error.message);
        
        if (exportPdfBtn) {
            exportPdfBtn.disabled = false;
            exportPdfBtn.innerHTML = originalText;
        }
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Add material button
    if (addMaterialBtn) {
        addMaterialBtn.addEventListener('click', addMaterialRow);
    }
    
    // Reset button
    if (resetBtn) {
        resetBtn.addEventListener('click', resetForm);
    }
    
    // Printer select
    if (printerSelect) {
        printerSelect.addEventListener('change', updatePrinterDetails);
    }
    
    // Form inputs that trigger cost calculation
    const costInputs = [
        printTimeInput, quantityInput, failureRateInput,
        electricityCostInput, laborRateInput, laborHoursInput,
        packagingCostInput, document.getElementById('shipping-cost')
    ];
    
    costInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', calculateCosts);
        }
    });
    
    // Calculation type selects
    const calculationTypeSelects = [
        document.getElementById('labor-calculation-type'),
        document.getElementById('packaging-calculation-type'),
        document.getElementById('shipping-calculation-type')
    ];
    
    calculationTypeSelects.forEach(select => {
        if (select) {
            select.addEventListener('change', calculateCosts);
        }
    });
    
    // Pricing options
    document.querySelectorAll('input[name="pricingOption"]').forEach(radio => {
        radio.addEventListener('change', updateTotalCost);
    });
    
    // Custom margin input
    const customMarginInput = document.getElementById('custom-margin');
    if (customMarginInput) {
        customMarginInput.addEventListener('input', updateTotalCost);
    }
    
    // Language toggle
    if (languageToggle) {
        languageToggle.addEventListener('change', toggleLanguage);
    }
    
    // Unit toggle
    if (unitToggle) {
        unitToggle.addEventListener('change', toggleUnits);
    }
    
    // Export PDF
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', exportToPdf);
    }
}

// Calculation type selects
const packagingCalculationType = document.getElementById('packaging-calculation-type');
const shippingCalculationType = document.getElementById('shipping-calculation-type');
const laborCalculationType = document.getElementById('labor-calculation-type');

// State
let currencySymbol = '€';
let isMetric = true;
let currentLang = 'en';
let costAllocationChart = null;

// Printer database with power consumption in watts
const printers = {
    // FDM Printers
    'fdm_generic': { name: 'FDM Generic Custom', power: 250, type: 'fdm' },
    'bambu_x1': { name: 'Bambu Lab X1 Carbon', power: 350, type: 'fdm' },
    'bambu_p1p': { name: 'Bambu Lab P1P', power: 300, type: 'fdm' },
    'prusa_mk4': { name: 'Prusa i3 MK4', power: 200, type: 'fdm' },
    'prusa_mk3s': { name: 'Prusa i3 MK3S+', power: 180, type: 'fdm' },
    'ender3_v3': { name: 'Creality Ender-3 V3 SE', power: 220, type: 'fdm' },
    'ender3': { name: 'Creality Ender-3 V2', power: 200, type: 'fdm' },
    'ender3_s1': { name: 'Creality Ender-3 S1', power: 210, type: 'fdm' },
    'sovol_sv06': { name: 'Sovol SV06', power: 280, type: 'fdm' },
    'elegoo_neptune4': { name: 'Elegoo Neptune 4 Pro', power: 250, type: 'fdm' },
    'anycubic_kobra2': { name: 'Anycubic Kobra 2', power: 230, type: 'fdm' },
    
    // Resin Printers
    'sla_generic': { name: 'SLA Generic Custom', power: 80, type: 'resin' },
    'elegoo_mars4': { name: 'Elegoo Mars 4 Ultra', power: 80, type: 'resin' },
    'elegoo_mars3': { name: 'Elegoo Mars 3', power: 60, type: 'resin' },
    'elegoo_saturn3': { name: 'Elegoo Saturn 3 Ultra', power: 90, type: 'resin' },
    'anycubic_photon_m3': { name: 'Anycubic Photon M3 Max', power: 85, type: 'resin' },
    'anycubic_photon_m3_plus': { name: 'Anycubic Photon M3 Plus', power: 75, type: 'resin' },
    'photon_mono_x': { name: 'Anycubic Photon Mono X', power: 75, type: 'resin' },
    'formlabs_form3': { name: 'Formlabs Form 3+', power: 100, type: 'resin' },
    'phrozen_sonic_mighty8k': { name: 'Phrozen Sonic Mighty 8K', power: 95, type: 'resin' },
    'creality_halot_one': { name: 'Creality Halot-One Pro', power: 70, type: 'resin' },
    'creality_ld006': { name: 'Creality LD-006', power: 80, type: 'resin' }
};

// Default color palette for materials
const materialColors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
    '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
    '#795548', '#9E9E9E', '#607D8B', '#000000', '#FFFFFF'
];

// Default colors for material types
const defaultMaterialColors = {
    'pla': '#4CAF50',
    'petg': '#2196F3',
    'abs': '#F44336',
    'tpu': '#9C27B0',
    'pc': '#607D8B',
    'resin': '#FFC107',
    'default': '#9E9E9E'
};

// Material database with cost per kg or liter and default colors
const materials = {
    // Generic FDM Materials with densities (g/cm³)
    pla: { name: 'PLA (Generic)', cost: 20, type: 'fdm', color: defaultMaterialColors.pla, density: 1.24 },
    petg: { name: 'PETG (Generic)', cost: 25, type: 'fdm', color: defaultMaterialColors.petg, density: 1.27 },
    abs: { name: 'ABS (Generic)', cost: 30, type: 'fdm', color: defaultMaterialColors.abs, density: 1.04 },
    tpu: { name: 'TPU (Generic)', cost: 40, type: 'fdm', color: defaultMaterialColors.tpu, density: 1.21 },
    
    // Rosa3D FDM Filaments
    rosa_pla: { name: 'Rosa3D PLA', cost: 25, type: 'fdm', color: '#4CAF50' },
    rosa_pla_plus: { name: 'Rosa3D PLA+', cost: 28, type: 'fdm', color: '#8BC34A' },
    rosa_petg: { name: 'Rosa3D PETG', cost: 30, type: 'fdm', color: '#2196F3' },
    rosa_abs: { name: 'Rosa3D ABS', cost: 35, type: 'fdm', color: '#F44336' },
    rosa_tpu: { name: 'Rosa3D TPU', cost: 45, type: 'fdm', color: '#9C27B0' },
    
    // Spectrum Filaments
    spectrum_pla: { name: 'Spectrum PLA', cost: 28, type: 'fdm', color: '#4CAF50' },
    spectrum_petg: { name: 'Spectrum PETG', cost: 32, type: 'fdm', color: '#2196F3' },
    spectrum_abs: { name: 'Spectrum ABS', cost: 38, type: 'fdm', color: '#F44336' },
    spectrum_tpu: { name: 'Spectrum TPU', cost: 48, type: 'fdm', color: '#9C27B0' },
    spectrum_pc: { name: 'Spectrum PC', cost: 55, type: 'fdm', color: '#607D8B' },
    
    // Generic Resins
    standard_resin: { name: 'Standard Resin (Generic)', cost: 40, type: 'resin', color: '#FFC107' },
    abs_like_resin: { name: 'ABS-like Resin (Generic)', cost: 50, type: 'resin', color: '#FF9800' },
    flexible_resin: { name: 'Flexible Resin (Generic)', cost: 60, type: 'resin', color: '#FF5722' },
    tough_resin: { name: 'Tough Resin (Generic)', cost: 70, type: 'resin', color: '#795548' },
    water_washable: { name: 'Water Washable Resin (Generic)', cost: 55, type: 'resin', color: '#00BCD4' },
    
    // Anycubic Resins
    anycubic_standard: { name: 'Anycubic Standard Resin', cost: 35, type: 'resin', color: '#FFC107' },
    anycubic_eco: { name: 'Anycubic Eco Resin', cost: 38, type: 'resin', color: '#8BC34A' },
    anycubic_abs_like: { name: 'Anycubic ABS-Like', cost: 45, type: 'resin', color: '#FF9800' },
    anycubic_tough: { name: 'Anycubic Tough Resin', cost: 60, type: 'resin', color: '#795548' },
    anycubic_water_wash: { name: 'Anycubic Water Washable', cost: 42, type: 'resin', color: '#00BCD4' },
    
    // Elegoo Resins
    elegoo_standard: { name: 'Elegoo Standard Resin', cost: 32, type: 'resin', color: '#FFC107' },
    elegoo_abs_like: { name: 'Elegoo ABS-Like', cost: 42, type: 'resin', color: '#FF9800' },
    elegoo_water_wash: { name: 'Elegoo Water Washable', cost: 40, type: 'resin', color: '#00BCD4' },
    elegoo_plant_based: { name: 'Elegoo Plant-Based', cost: 45, type: 'resin', color: '#8BC34A' },
    elegoo_durable: { name: 'Elegoo Durable Resin', cost: 58, type: 'resin' },
    
    // Specialty Resins
    siraya_tech_tenacious: { name: 'Siraya Tech Tenacious', cost: 75, type: 'resin' },
    siraya_tech_blue: { name: 'Siraya Tech Blu', cost: 65, type: 'resin' },
    phrozen_abs_like: { name: 'Phrozen ABS-Like', cost: 55, type: 'resin' },
    phrozen_water_wash: { name: 'Phrozen Water Washable', cost: 48, type: 'resin' }
};

// Reset form to default values
function resetForm() {
    // Reset form inputs
    form.reset();
    
    // Clear materials container and add one default material row
    materialsContainer.innerHTML = '';
    addMaterialRow();
    
    // Reset other form fields to default values
    printerSelect.value = 'bambu_x1';
    const powerInput = document.getElementById('printer-power');
    if (powerInput) powerInput.value = printers['bambu_x1'].power;
    
    // Trigger calculation
    calculateCosts();
}

// Initialize the application
function init() {
    console.log('Initializing application...');
    
    // Set up event listeners
    const addMaterialBtn = document.getElementById('add-material');
    if (addMaterialBtn) {
        addMaterialBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Add the same type as the last material, or default to PLA
            const lastMaterial = document.querySelector('.material-row:last-child .material-type');
            const materialType = lastMaterial ? lastMaterial.value : 'PLA';
            addMaterialRow(materialType);
        });
    }
    
    // Printer select is already initialized at the top
    if (printerSelect && !printerSelect.value) {
        printerSelect.value = 'fdm_generic';
        updatePrinterDetails();
    }
    
    // Set up input listeners for cost calculation
    const form = document.getElementById('calculator-form');
    if (form) {
        form.addEventListener('input', (e) => {
            if (e.target.id !== 'add-material') {
                calculateCosts();
            }
        });
    }
    
    // Initialize the cost allocation chart
    updateCostAllocationChart(0, 0, 0);
    
    // Function to handle pricing changes
    const handlePricingChange = () => {
        console.log('Pricing option changed, updating costs and chart');
        // Get current costs from the DOM or calculate them
        const materialCost = parseFloat(document.getElementById('material-cost')?.textContent?.replace(/[^0-9.,]+/g, '').replace(',', '.') || 0);
        const electricityCost = parseFloat(document.getElementById('electricity-cost-result')?.textContent?.replace(/[^0-9.,]+/g, '').replace(',', '.') || 0);
        const laborCost = parseFloat(document.getElementById('labor-cost-result')?.textContent?.replace(/[^0-9.,]+/g, '').replace(',', '.') || 0);
        
        // Update the total cost display
        updateTotalCost();
        
        // Update the chart with current costs
        updateCostAllocationChart(materialCost, electricityCost, laborCost);
    };
    
    // Add event listeners for pricing option changes
    document.querySelectorAll('input[name="pricingOption"]').forEach(radio => {
        radio.addEventListener('change', handlePricingChange);
    });
    
    // Add event listener for custom margin input
    const customMarginInput = document.getElementById('custom-margin');
    if (customMarginInput) {
        customMarginInput.addEventListener('input', () => {
            const customRadio = document.getElementById('pricing-custom');
            if (customRadio && customRadio.checked) {
                console.log('Custom margin changed, updating costs and chart');
                handlePricingChange();
            }
        });
    }
    
    // Set default printer if not already set
    if (printerSelect && !printerSelect.value) {
        printerSelect.value = 'fdm_generic';
        updatePrinterDetails();
    }
    
    // Initialize calculations after a small delay to ensure DOM is ready
    setTimeout(() => {
        calculateCosts();
    }, 100);
}

// Add a new material row with default values
function addMaterialRow(materialType = 'PLA') {
    const materialsContainer = document.getElementById('materials-container');
    if (!materialsContainer) {
        console.error('Materials container not found');
        return;
    }
    
    const materialCount = document.querySelectorAll('.material-row').length;
    
    // If this is the first material and we already have materials, don't add another
    if (materialCount === 0 && document.querySelectorAll('.material-row').length > 0) {
        return;
    }
    
    // Default material values
    const defaults = {
        'PLA': { cost: 20.00, color: '#808080', density: 1.24 },
        'ABS': { cost: 25.00, color: '#404040', density: 1.04 },
        'PETG': { cost: 30.00, color: '#00aaff', density: 1.27 },
        'TPU': { cost: 40.00, color: '#ff7700', density: 1.21 },
        'Resin': { cost: 50.00, color: '#a0a0a0', density: 1.12 }
    };
    
    const defaultMat = defaults[materialType] || defaults['PLA'];
    
    const materialRow = document.createElement('div');
    materialRow.className = 'material-row mb-3 p-2 border rounded';
    materialRow.innerHTML = `
        <div class="row g-2 align-items-end">
            <div class="col-md-3">
                <label class="form-label small mb-1">Material</label>
                <select class="form-select form-select-sm material-type">
                    <!-- Generic Materials -->
                    <optgroup label="Generic Materials">
                        ${Object.entries(materials).filter(([_, mat]) => !mat.name.includes('Rosa3D') && !mat.name.includes('Spectrum') && !mat.name.includes('(Generic)')).map(([key, mat]) => 
                            `<option value="${key}" ${materialType === key ? 'selected' : ''} data-cost="${mat.cost}" data-density="${mat.density || '1.24'}" data-color="${mat.color || defaultMaterialColors.default}">${mat.name}</option>`
                        ).join('')}
                    </optgroup>
                    <!-- Rosa3D Filaments -->
                    <optgroup label="Rosa3D Filaments">
                        ${Object.entries(materials).filter(([_, mat]) => mat.name.includes('Rosa3D')).map(([key, mat]) => 
                            `<option value="${key}" ${materialType === key ? 'selected' : ''} data-cost="${mat.cost}" data-density="${mat.density || '1.24'}" data-color="${mat.color || defaultMaterialColors.default}">${mat.name}</option>`
                        ).join('')}
                    </optgroup>
                    <!-- Spectrum Filaments -->
                    <optgroup label="Spectrum Filaments">
                        ${Object.entries(materials).filter(([_, mat]) => mat.name.includes('Spectrum')).map(([key, mat]) => 
                            `<option value="${key}" ${materialType === key ? 'selected' : ''} data-cost="${mat.cost}" data-density="${mat.density || '1.24'}" data-color="${mat.color || defaultMaterialColors.default}">${mat.name}</option>`
                        ).join('')}
                    </optgroup>
                </select>
            </div>
            <div class="col-md-1">
                <label class="form-label small mb-1">Color</label>
                <input type="color" class="form-control form-control-color color-picker p-0 w-100" value="${defaultMat.color}" style="height: 31px">
            </div>
            <div class="col-md-2">
                <label class="form-label small mb-1">Weight (g)</label>
                <input type="number" class="form-control form-control-sm material-weight" value="100" step="0.1" min="0">
            </div>
            <div class="col-md-2">
                <label class="form-label small mb-1">Cost (€/kg)</label>
                <input type="number" class="form-control form-control-sm material-cost" value="${defaultMat.cost}" step="0.01" min="0">
            </div>
            <div class="col-md-2">
                <label class="form-label small mb-1">Density (g/cm³)</label>
                <input type="number" class="form-control form-control-sm material-density" value="${defaultMat.density}" step="0.01" min="0.1">
            </div>
            <div class="col-md-2">
                <label class="form-label small mb-1">Calculation</label>
                <select class="form-select form-select-sm material-calculation-type">
                    <option value="total">Total Material</option>
                    <option value="per-piece">Per Piece</option>
                </select>
            </div>
            <div class="col-md-2">
                <label class="form-label small mb-1">Total (g)</label>
                <div class="form-control form-control-sm bg-light material-total-weight text-center">0.0</div>
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-sm btn-outline-danger w-100 remove-material" ${materialCount === 1 ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    materialsContainer.appendChild(materialRow);
    
    // Add event listeners
    const colorPicker = materialRow.querySelector('.color-picker');
    const colorPreview = materialRow.querySelector('.color-preview');
    
    if (colorPicker && colorPreview) {
        colorPicker.addEventListener('input', (e) => {
            colorPreview.style.backgroundColor = e.target.value;
            calculateCosts();
        });
    }
    
    // Trigger initial calculation
    calculateCosts();
    
    // Add event listeners for all inputs and selects
    materialRow.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', calculateCosts);
    });
    
    // Add event listener for the remove button
    materialRow.querySelector('.remove-material').addEventListener('click', () => {
        if (document.querySelectorAll('.material-row').length > 1) {
            materialRow.remove();
            calculateCosts();
        }
    });
    
    // Add change event for material type to update default values
    const materialTypeSelect = materialRow.querySelector('.material-type');
    const colorInput = materialRow.querySelector('.color-picker');
    const costInput = materialRow.querySelector('.material-cost');
    const densityInput = materialRow.querySelector('.material-density');
    
    if (materialTypeSelect) {
        materialTypeSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const cost = selectedOption.getAttribute('data-cost');
            const density = selectedOption.getAttribute('data-density');
            const color = selectedOption.getAttribute('data-color');
            
            if (colorInput) {
                colorInput.value = color || defaultMaterialColors.default;
            }
            if (costInput) {
                costInput.value = cost || '0';
                costInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (densityInput) {
                densityInput.value = density || '1.24';
                densityInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            calculateCosts();
        });
    }
    
    calculateCosts();
    return materialRow;
}

// Update material options based on printer type
function updateMaterialOptions(printerType) {
    console.log(`Updating material options for printer type: ${printerType}`);
    
    // Define material options based on printer type
    const materialOptions = {
        'fdm': [
            { id: 'pla', name: 'PLA', cost: 20.00, density: 1.24, color: '#808080' },
            { id: 'abs', name: 'ABS', cost: 25.00, density: 1.04, color: '#404040' },
            { id: 'petg', name: 'PETG', cost: 30.00, density: 1.27, color: '#00aaff' },
            { id: 'tpu', name: 'TPU', cost: 40.00, density: 1.21, color: '#ff7700' }
        ],
        'resin': [
            { id: 'resin_standard', name: 'Standard Resin', cost: 50.00, density: 1.12, color: '#a0a0a0' },
            { id: 'resin_water_washable', name: 'Water Washable Resin', cost: 60.00, density: 1.15, color: '#b0c4de' },
            { id: 'resin_tough', name: 'Tough Resin', cost: 70.00, density: 1.18, color: '#d3d3d3' }
        ]
    };
    
    // Get the appropriate materials for the printer type
    const materials = materialOptions[printerType] || [];
    
    // Get all material type selects
    const materialTypeSelects = document.querySelectorAll('.material-type');
    
    materialTypeSelects.forEach(select => {
        // Store the current value
        const currentValue = select.value;
        
        // Clear existing options
        select.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select Material';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        select.appendChild(defaultOption);
        
        // Add material options
        materials.forEach(material => {
            const option = document.createElement('option');
            option.value = material.id;
            option.textContent = material.name;
            option.dataset.cost = material.cost;
            option.dataset.density = material.density;
            option.dataset.color = material.color;
            select.appendChild(option);
        });
        
        // Restore the previous value if it's still valid
        if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
            select.value = currentValue;
        } else if (select.options.length > 1) {
            // Select the first available material if previous value is not valid
            select.selectedIndex = 1;
        }
        
        // Trigger change event to update dependent fields
        select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    console.log(`Updated material options for ${printerType} printer`);
}

// Update printer details based on selection
function updatePrinterDetails() {
    console.log('Updating printer details...');
    if (!printerSelect) {
        console.error('Printer select element not found');
        return;
    }
    
    const printerId = printerSelect.value;
    console.log('Selected printer ID:', printerId);
    
    // Clear existing materials
    const materialsContainer = document.getElementById('materials-container');
    if (materialsContainer) {
        materialsContainer.innerHTML = '';
    }
    
    if (printerId && printerId !== 'custom') {
        const printer = printers[printerId];
        if (printer) {
            console.log('Found printer:', printer);
            
            // Update printer power
            const powerInput = document.getElementById('printer-power');
            if (powerInput) {
                powerInput.value = printer.power;
                console.log('Updated printer power to:', printer.power);
                // Force update the power value in the UI and trigger calculation
                const inputEvent = new Event('input', { bubbles: true });
                const changeEvent = new Event('change', { bubbles: true });
                powerInput.dispatchEvent(inputEvent);
                powerInput.dispatchEvent(changeEvent);
                // Recalculate costs after a small delay to ensure UI updates
                setTimeout(calculateCosts, 100);
            } else {
                console.error('Power input element not found');
            }
        }
        
        // Clear existing materials
        if (materialsContainer) {
            console.log('Clearing existing materials');
            materialsContainer.innerHTML = '';
        }
        
        // Add default material based on printer type
        const defaultMaterial = printer.type === 'fdm' ? 'PLA' : 'Resin';
        console.log('Adding default material:', defaultMaterial);
        addMaterialRow(defaultMaterial);
        
        // Update material options based on printer type
        updateMaterialOptions(printer.type);
        
        // Recalculate costs after a short delay to ensure DOM updates
        setTimeout(calculateCosts, 100);
    } else {
        console.log('Custom printer selected, adding default PLA material');
        // For custom printer, add default PLA material
        addMaterialRow('pla');
        calculateCosts();
    }
}

// Toggle between English and Spanish
function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'es' : 'en';
    
    // Update UI text based on language
    const translations = {
        en: {
            // Main header
            'app-title': '3D Printing Cost Calculator',
            'language': 'EN/ES',
            'units': 'g/ml',
            
            // Section headers
            'printer-settings': 'Printer Settings',
            'print-information': 'Print Information',
            'materials': 'Materials',
            'cost-settings': 'Others',
            'suggested-pricing': 'Suggested Pricing',
            'cost-summary': 'Cost Summary',
            'cost-allocation': 'Cost Allocation',
            'custom': 'Custom',
            
            // Form labels
            'printer-label': 'Printer Model',
            'power-label': 'Power Consumption',
            'print-time-label': 'Print Time',
            'quantity-label': 'Quantity',
            'failure-rate': 'Failure Rate',
            'electricity-cost': 'Electricity Cost',
            'labor-cost': 'Labor Cost',
            'labor-rate': 'Labor Rate',
            'labor-hours': 'Labor Hours',
            'calculation-type': 'Calculation',
            'material-label': 'Material',
            'weight-label': 'Weight',
            'cost-per-kg': 'Cost per kg',
            'remove': 'Remove',
            'total': 'Total',
            'packaging-cost': 'Packaging Cost',
            'shipping-cost': 'Shipping Cost',
            'calculation-type': 'Calculation',
            'total-amount': 'Total Amount (×1)',
            'per-piece': 'Per Piece (×Qty)',
            
            // Buttons
            'add-material': 'Add Material',
            'calculate': 'Calculate',
            'reset': 'Reset',
            'export-pdf': 'Export PDF',
            
            // Results
            'material-cost': 'Material Cost',
            'electricity-cost-result': 'Electricity Cost',
            'labor-cost-result': 'Labor Cost',
            'subtotal': 'Subtotal',
            'base-cost': 'Base Cost',
            'total-cost': 'Total Cost',
            
            // Suggested pricing
            'competitive': 'Competitive',
            'standard': 'Standard',
            'premium': 'Premium',
            'luxury': 'Luxury',
            'custom-margin': 'Custom Margin',
            'profit-margin': 'Profit Margin',
            'price': 'Price',
            'per-piece': 'Per Piece',
            'total-hours': 'Total Hours (×1)'
        },
        es: {
            // Main header
            'app-title': 'Calculadora de Costos de Impresión 3D',
            'language': 'ES/EN',
            'units': 'g/ml',
            
            // Section headers
            'printer-settings': 'Configuración de la Impresora',
            'print-information': 'Información de la Impresión',
            'materials': 'Materiales',
            'cost-settings': 'Otros',
            'suggested-pricing': 'Precios Sugeridos',
            'cost-summary': 'Resumen de Costos',
            'cost-allocation': 'Distribución de Costos',
            'custom': 'Personalizado',
            
            // Form labels
            'printer-label': 'Modelo de Impresora',
            'power-label': 'Consumo de Energía',
            'print-time-label': 'Tiempo de Impresión',
            'quantity-label': 'Cantidad',
            'failure-rate': 'Tasa de Falla',
            'electricity-cost': 'Costo de Electricidad',
            'labor-cost': 'Costo de Mano de Obra',
            'labor-rate': 'Tarifa por Hora',
            'labor-hours': 'Horas de Trabajo',
            'calculation-type': 'Cálculo',
            'material-label': 'Material',
            'weight-label': 'Peso',
            'cost-per-kg': 'Costo por kg',
            'remove': 'Eliminar',
            'total': 'Total',
            
            // Buttons
            'add-material': 'Añadir Material',
            'calculate': 'Calcular',
            'reset': 'Reiniciar',
            'export-pdf': 'Exportar PDF',
            
            // Results
            'material-cost': 'Costo de Material',
            'electricity-cost-result': 'Costo de Electricidad',
            'labor-cost-result': 'Mano de Obra',
            'subtotal': 'Subtotal',
            'base-cost': 'Costo Base',
            'total-cost': 'Costo Total',
            
            // Suggested pricing
            'competitive': 'Competitivo',
            'standard': 'Estándar',
            'premium': 'Premium',
            'luxury': 'Lujo',
            'custom-margin': 'Margen Personalizado',
            'profit-margin': 'Margen de Ganancia',
            'price': 'Precio',
            'per-piece': 'Por Pieza',
            'total-hours': 'Horas Totales (×1)'
        }
    };

    // Update all text elements
    Object.entries(translations[currentLang]).forEach(([key, value]) => {
        const elements = document.querySelectorAll(`[data-i18n="${key}"]`);
        elements.forEach(el => {
            el.textContent = value;
        });
    });

    // Update currency symbol based on language
    currencySymbol = currentLang === 'en' ? '€' : '€';
    
    // Recalculate to update currency symbols
    calculateCosts();
}

// Toggle between metric and imperial units
function toggleUnitSystem() {
    isMetric = !isMetric;
    const unitDisplay = document.querySelector('#unit-toggle [data-i18n="units"]');
    if (unitDisplay) {
        unitDisplay.textContent = isMetric ? 'g/ml' : 'oz/in³';
    }
    
    // Update power input display
    const printerPowerInput = document.getElementById('printer-power');
    if (printerPowerInput) {
        const powerValue = parseFloat(printerPowerInput.value) || 0;
        printerPowerInput.value = isMetric ? powerValue : Math.round(powerValue * 0.00134102 * 100) / 100;
    }
    
    const powerLabel = document.querySelector('label[for="printer-power"]');
    if (powerLabel) {
        powerLabel.textContent = isMetric ? 'Power Consumption (W)' : 'Power Consumption (hp)';
    }
    
    calculateCosts();
}

// Alias for toggleUnitSystem for backward compatibility
function toggleUnits() {
    toggleUnitSystem();
}

// Global variable for estimate number
let currentEstimateNumber = '';

// Calculate all costs
function calculateCosts(e) {
    if (e) e.preventDefault();
    
    try {
        // Get values from form inputs with null checks
        const getElementValue = (id, defaultValue = 0) => {
            const el = document.getElementById(id);
            return el && !isNaN(parseFloat(el.value)) ? parseFloat(el.value) : defaultValue;
        };

        const now = new Date();
        // Format: YYYYMMDDHHMMSS
        currentEstimateNumber = `${now.getFullYear()}` +
            `${String(now.getMonth() + 1).padStart(2, '0')}` +
            `${String(now.getDate()).padStart(2, '0')}` +
            `${String(now.getHours()).padStart(2, '0')}` +
            `${String(now.getMinutes()).padStart(2, '0')}` +
            `${String(now.getSeconds()).padStart(2, '0')}`;
            
        const printTimeHours = getElementValue('print-time', 0);
        const laborRate = getElementValue('labor-rate', 15); // Default €15/hour
        const laborHours = getElementValue('labor-hours', 0);
        const packagingCost = getElementValue('packaging-cost', 0);
        const shippingCost = getElementValue('shipping-cost', 0);
        const electricityRate = getElementValue('electricity-cost', 0.2); // Default €0.20/kWh
        const failureRate = getElementValue('failure-rate', 0); // Default 0% failure rate
        const quantityEl = document.getElementById('quantity');
        const quantity = quantityEl ? parseInt(quantityEl.value) || 1 : 1;
        
        // Get select values with null checks
        const getSelectValue = (id, defaultValue = '') => {
            const el = document.getElementById(id);
            return el ? el.value : defaultValue;
        };
        
        const packagingCalculationType = getSelectValue('packaging-calculation-type');
        const shippingCalculationType = getSelectValue('shipping-calculation-type');
        
        console.log('Input values:', { 
            printTimeHours, 
            quantity, 
            failureRate, 
            electricityRate, 
            laborRate, 
            laborHours, 
            packagingCost, 
            packagingCalculationType,
            shippingCost,
            shippingCalculationType
        });
        
        // Calculate material costs and weights from all material rows
        let totalMaterialCost = 0;
        let totalWeight = 0;
        
        // Clear previous total weight display
        const existingTotalWeight = document.getElementById('total-weight-display');
        if (existingTotalWeight) {
            existingTotalWeight.remove();
        }
        
        document.querySelectorAll('.material-row').forEach((row, index) => {
            const weight = parseFloat(row.querySelector('.material-weight').value) || 0;
            const costPerKg = parseFloat(row.querySelector('.material-cost').value) || 0;
            const calculationType = row.querySelector('.material-calculation-type').value || 'total';
            
            // Calculate material cost based on calculation type
            let materialCost, materialWeight;
            
            if (calculationType === 'per-piece') {
                // For 'per-piece', calculate cost for one piece and multiply by quantity
                materialCost = (weight * (costPerKg / 1000)) * quantity; // (g * €/kg / 1000) * qty = €
                materialWeight = weight * quantity;
            } else {
                // For 'total', the weight is already the total weight for all pieces
                materialCost = weight * (costPerKg / 1000); // g * €/kg / 1000 = €
                materialWeight = weight;
            }
            
            totalMaterialCost += materialCost;
            totalWeight += materialWeight;
            
            // Update the total weight display next to the calculation type
            const totalWeightDisplay = row.querySelector('.material-total-weight');
            if (totalWeightDisplay) {
                totalWeightDisplay.textContent = materialWeight.toFixed(1);
            }
            
            console.log(`Material ${index + 1}:`, { 
                weight, 
                costPerKg, 
                materialCost,
                materialWeight,
                calculationType,
                quantity,
                totalMaterialCost
            });
        });
        
        // Add total weight display at the bottom of materials container
        if (totalWeight > 0) {
            const materialsContainer = document.getElementById('materials-container');
            const totalWeightDisplay = document.createElement('div');
            totalWeightDisplay.id = 'total-weight-display';
            totalWeightDisplay.className = 'row g-2 align-items-end mt-2';
            totalWeightDisplay.innerHTML = `
                <div class="col-md-3">
                    <label class="form-label small mb-1">Total Weight</label>
                    <div class="form-control form-control-sm bg-light">${totalWeight.toFixed(1)} g</div>
                </div>
            `;
            
            // Add the total weight display at the end of the container
            materialsContainer.appendChild(totalWeightDisplay);
        }
        
        // Calculate electricity cost
        const printerPower = parseFloat(document.getElementById('printer-power').value) || 0; // in watts
        const electricityCost = (printerPower * printTimeHours / 1000) * electricityRate; // Convert to kWh then multiply by rate
        console.log('Electricity cost calculated:', { printerPower, printTimeHours, electricityRate, electricityCost });
        
        // Calculate labor cost based on calculation type
        const laborCalculationType = document.getElementById('labor-calculation-type').value;
        let laborCost = laborRate * laborHours;
        
        // Apply quantity if labor is calculated per piece
        if (laborCalculationType === 'per-piece') {
            laborCost *= quantity;
        }
        
        // Don't apply failure rate to labor cost by default
        // If you want to include failure rate, uncomment the next line
        // laborCost *= failureMultiplier;
        
        // Calculate packaging and shipping costs based on calculation type
        let totalPackagingCost = packagingCalculationType === 'per-piece' 
            ? packagingCost * quantity 
            : packagingCost;
            
        let totalShippingCost = shippingCalculationType === 'per-piece'
            ? shippingCost * quantity
            : shippingCost;
            
        console.log('Packaging and shipping costs:', {
            packagingCost,
            totalPackagingCost,
            packagingCalculationType,
            shippingCost,
            totalShippingCost,
            shippingCalculationType,
            quantity
        });
        
        // Calculate failure multiplier (e.g., 5% failure rate = 1.05 multiplier)
        const failureMultiplier = 1 + (failureRate / 100);
        
        // Calculate final costs with failure rate applied to material costs
        const finalMaterialCost = totalMaterialCost * failureMultiplier;
        
        // Calculate total base cost (materials with failure rate + other costs)
        const baseCost = finalMaterialCost + electricityCost + laborCost + totalPackagingCost + totalShippingCost;
        
        // Electricity cost is for the total print time, not per piece
        const finalElectricityCost = electricityCost * failureMultiplier;
        
        // Labor cost depends on the calculation type
        const finalLaborCost = laborCalculationType === 'per-piece' 
            ? laborCost * failureMultiplier  // laborCost is already multiplied by quantity in the first calculation
            : laborCost * failureMultiplier; // Use as is for total hours
            
        // Packaging and shipping costs are not affected by failure rate
        const finalPackagingCost = totalPackagingCost;
        const finalShippingCost = totalShippingCost;
        
        console.log('Final costs after all calculations:', {
            material: finalMaterialCost,
            electricity: finalElectricityCost,
            labor: finalLaborCost,
            quantity,
            failureMultiplier
        });
        
        console.log('Calculated costs:', {
            material: finalMaterialCost,
            electricity: finalElectricityCost,
            labor: finalLaborCost,
            failureMultiplier
        });
        
        // Update the UI with the calculated costs
        updateResults(finalMaterialCost, finalElectricityCost, finalLaborCost, finalPackagingCost, finalShippingCost);
        
        // Update the cost allocation chart
        updateCostAllocationChart(finalMaterialCost, finalElectricityCost, finalLaborCost, finalPackagingCost, finalShippingCost);
        
    } catch (error) {
        console.error('Error calculating costs:', error);
    }
}

// Update the UI with calculated results
function updateResults(materialCost = 0, electricityCost = 0, laborCost = 0, packagingCost = 0, shippingCost = 0) {
    try {
        // Format number with 2 decimal places
        const formatNumber = (num) => {
            return Number(num).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        };

        // Update material cost display
        const materialCostEl = document.getElementById('material-cost');
        if (materialCostEl) {
            materialCostEl.textContent = `€${formatNumber(materialCost)}`;
        }

        // Update electricity cost display
        const electricityCostEl = document.getElementById('electricity-cost-result');
        if (electricityCostEl) {
            electricityCostEl.textContent = `€${formatNumber(electricityCost)}`;
        }

        // Update labor cost display
        const laborCostEl = document.getElementById('labor-cost-result');
        if (laborCostEl) {
            laborCostEl.textContent = `€${formatNumber(laborCost)}`;
        }

        // Update packaging cost display
        const packagingCostEl = document.getElementById('packaging-cost-result');
        if (packagingCostEl) {
            packagingCostEl.textContent = `€${formatNumber(packagingCost)}`;
        }

        // Update shipping cost display
        const shippingCostEl = document.getElementById('shipping-cost-result');
        if (shippingCostEl) {
            shippingCostEl.textContent = `€${formatNumber(shippingCost)}`;
        }

        // Calculate and update base cost (sum of all costs before margin)
        const baseCost = materialCost + electricityCost + laborCost + packagingCost + shippingCost;
        const baseCostEl = document.getElementById('base-cost');
        if (baseCostEl) {
            baseCostEl.textContent = `€${formatNumber(baseCost)}`;
        }

        // Update the total cost with the current pricing option
        updateTotalCost();

    } catch (error) {
        console.error('Error updating results:', error);
    }
}

// Update the cost allocation chart
function updateCostAllocationChart(materialCost = 0, electricityCost = 0, laborCost = 0, packagingCost = 0, shippingCost = 0, marginPercent = 0) {
    console.log('Updating cost allocation chart with:', { materialCost, electricityCost, laborCost, packagingCost, shippingCost });
    const canvas = document.getElementById('costAllocationChart');
    if (!canvas) {
        console.error('Cost allocation chart canvas not found');
        return;
    }
    
    let ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2D context for chart');
        return;
    }
    
    // If we have a chart already, destroy it first
    if (window.costAllocationChart && typeof window.costAllocationChart.destroy === 'function') {
        window.costAllocationChart.destroy();
        window.costAllocationChart = null;
    }
    
    // Ensure we have valid numbers
    materialCost = parseFloat(materialCost) || 0;
    electricityCost = parseFloat(electricityCost) || 0;
    laborCost = parseFloat(laborCost) || 0;
    packagingCost = parseFloat(packagingCost) || 0;
    shippingCost = parseFloat(shippingCost) || 0;
    
    // Calculate base cost (sum of material, electricity, labor, packaging, and shipping costs)
    const baseCost = materialCost + electricityCost + laborCost + packagingCost + shippingCost;
    
    // If marginPercent is not provided, get it from the selected pricing option
    if (marginPercent === undefined || marginPercent === null) {
        const selectedOption = document.querySelector('input[name="pricingOption"]:checked');
        if (selectedOption) {
            switch(selectedOption.value) {
                case 'competitive': marginPercent = 25; break;
                case 'standard': marginPercent = 40; break;
                case 'premium': marginPercent = 60; break;
                case 'luxury': marginPercent = 80; break;
                case 'custom':
                    const customMargin = document.getElementById('custom-margin');
                    marginPercent = customMargin ? parseInt(customMargin.value) || 25 : 25;
                    break;
            }
        }
    }
    
    // Ensure marginPercent is a number
    marginPercent = parseFloat(marginPercent) || 0;
    
    // Calculate margin amount and total with margin
    const marginAmount = baseCost * (marginPercent / 100);
    const totalWithMargin = baseCost + marginAmount;
    
    console.log('Updating chart with costs:', {
        materialCost,
        electricityCost,
        laborCost,
        packagingCost,
        shippingCost,
        marginAmount,
        totalWithMargin
    });
    
    // Prepare chart data
    const chartData = {
        labels: [
            `Material (€${materialCost.toFixed(2)})`,
            `Electricity (€${electricityCost.toFixed(2)})`,
            `Labor (€${laborCost.toFixed(2)})`,
            `Packaging (€${packagingCost.toFixed(2)})`,
            `Shipping (€${shippingCost.toFixed(2)})`,
            `Margin ${marginPercent}% (€${marginAmount.toFixed(2)})`
        ],
        datasets: [{
            data: [
                materialCost,
                electricityCost,
                laborCost,
                packagingCost,
                shippingCost,
                marginAmount
            ],
            backgroundColor: [
                '#4e73df', // Material - Blue
                '#1cc88a', // Electricity - Green
                '#f6c23e', // Labor - Yellow
                '#e74a3b',  // Packaging - Red
                '#9b59b6',  // Shipping - Purple
                '#ff69b4'  // Margin - Pink
            ],
            borderColor: [
                '#4e73df',
                '#1cc88a',
                '#f6c23e',
                '#e74a3b',
                '#9b59b6',
                '#ff69b4'
            ],
            borderWidth: 2
        }]
    };

    // Material Design Donut Chart Configuration
    const config = {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            radius: '100%',
            spacing: 0,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 8,
                        boxHeight: 8,
                        font: {
                            size: 12,
                            family: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                            color: '#5f6368'
                        }
                    },
                    onClick: function(e, legendItem, legend) {
                        const index = legendItem.datasetIndex;
                        const ci = legend.chart;
                        const meta = ci.getDatasetMeta(index);
                        meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
                        ci.update();
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(97, 97, 97, 0.9)',
                    titleFont: {
                        size: 12,
                        weight: '500',
                        family: 'Roboto, -apple-system, sans-serif'
                    },
                    bodyFont: {
                        size: 12,
                        family: 'Roboto, -apple-system, sans-serif'
                    },
                    padding: 10,
                    cornerRadius: 4,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label.split(' (')[0] || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: €${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                },
                // Disable default legend title
                legend: false
            },
            elements: {
                arc: {
                    borderWidth: 0,
                    borderJoinStyle: 'round',
                    spacing: 0
                }
            },
            layout: {
                padding: 5
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        },
        plugins: [{
            id: 'centerText',
            beforeDraw: function(chart) {
                const {width, height, ctx} = chart;
                const centerX = width / 2;
                const centerY = height / 2;
                
                // Save the current context state
                ctx.save();
                
                // Set text styles for the total amount
                const amountText = formatCurrency(totalWithMargin);
                const amountFontSize = Math.min(width, height) / 7.5; // Reduced from /6 to /7.5 for smaller text
                
                // Draw total amount (larger text)
                ctx.font = `500 ${amountFontSize}px 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#202124';
                
                // Draw text with shadow for depth
                ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
                ctx.shadowBlur = 2;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 1;
                
                // Draw the amount text
                ctx.fillText(amountText, centerX, centerY - 10);
                
                // Reset shadow for the label
                ctx.shadowColor = 'transparent';
                
                // Draw "TOTAL" label (smaller text)
                const labelText = 'TOTAL';
                const labelFontSize = Math.min(width, height) / 16;
                ctx.font = `400 ${labelFontSize}px 'Roboto', -apple-system, sans-serif`;
                ctx.fillStyle = '#5f6368';
                ctx.fillText(labelText, centerX, centerY + amountFontSize / 2);
                
                // Restore the context state
                ctx.restore();
            }
        }]
    };

    // Always create a new chart instance instead of updating
    try {
        // Destroy existing chart if it exists
        if (window.costAllocationChart && typeof window.costAllocationChart.destroy === 'function') {
            window.costAllocationChart.destroy();
        }

        // Create new chart instance
        window.costAllocationChart = new Chart(ctx, config);
        
        // Update the total cost display
        const totalCostEl = document.getElementById('total-cost');
        if (totalCostEl) {
            totalCostEl.textContent = formatCurrency(totalWithMargin);
        }
    } catch (error) {
        console.error('Error initializing chart:', error);
        // If there's an error, clear the canvas and show an error message
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '14px Arial';
            ctx.fillStyle = 'red';
            ctx.textAlign = 'center';
            ctx.fillText('Error loading chart', canvas.width / 2, canvas.height / 2);
        }
    }

// Update suggested prices based on base cost
function updateSuggestedPrices(baseCost) {
    if (isNaN(baseCost) || baseCost <= 0) return;
    
    const pricingOptions = [
        { id: 'competitive', margin: 0.10 },  // 10%
        { id: 'standard', margin: 0.15 },     // 15%
        { id: 'urgent', margin: 0.25 },       // 25% (previously premium)
        { id: 'crazy', margin: 0.50 },        // 50% (previously luxury)
        { id: 'custom', margin: 0.25 }        // Default custom margin, can be changed by user
    ];
    
    pricingOptions.forEach(option => {
        const priceElement = document.getElementById(`${option.id}-price`);
        if (priceElement) {
            const price = baseCost * (1 + option.margin);
            priceElement.textContent = `€${price.toFixed(2)}`;
        }
    });
    
    // Also update the custom price if it's selected
    updateTotalCost();
}

// Update total cost based on selected pricing option
function updateTotalCost() {
    try {
        // Get all individual costs
        const getCost = (id) => {
            const el = document.getElementById(id);
            return el ? parseFloat(el.textContent.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0 : 0;
        };
        
        // Get individual costs
        const materialCost = getCost('material-cost');
        const electricityCost = getCost('electricity-cost-result');
        const laborCost = getCost('labor-cost-result');
        const packagingCost = getCost('packaging-cost-result');
        const shippingCost = getCost('shipping-cost-result');
        
        // Calculate base cost as sum of all individual costs
        const baseCost = materialCost + electricityCost + laborCost + packagingCost + shippingCost;
        
        // Update the base cost display
        const baseCostEl = document.getElementById('base-cost');
        if (baseCostEl) {
            baseCostEl.textContent = `€${baseCost.toFixed(2)}`;
        }
        
        // Get selected pricing option
        const selectedOption = document.querySelector('input[name="pricingOption"]:checked');
        if (!selectedOption) return;
        
        let total = 0;
        let marginPercent = 0;
        const optionId = selectedOption.id.replace('pricing-', '');
        
        // Calculate margin based on selected option
        if (optionId === 'custom') {
            const customMarginInput = document.getElementById('custom-margin');
            marginPercent = customMarginInput ? parseFloat(customMarginInput.value) || 0 : 0;
        } else {
            // Map option IDs to their corresponding margin percentages
            const marginPercentages = {
                'competitive': 10,  // 10%
                'standard': 15,     // 15%
                'urgent': 25,       // 25%
                'crazy': 50         // 50%
            };
            marginPercent = marginPercentages[optionId] || 0;
        }
        
        // Calculate total with margin
        total = baseCost * (1 + (marginPercent / 100));
        
        // Update the total cost display
        const totalCostElement = document.getElementById('total-cost');
        if (totalCostElement) {
            totalCostElement.textContent = `€${total.toFixed(2)}`;
            
            // Update the margin percentage display if it exists
            const marginDisplay = document.getElementById('margin-percentage');
            if (marginDisplay) {
                marginDisplay.textContent = `${marginPercent}%`;
            }
        }
        
        // Update the chart with the new margin
        updateCostAllocationChart(
            materialCost,
            electricityCost,
            laborCost,
            packagingCost,
            shippingCost,
            marginPercent
        );
        
    } catch (error) {
        console.error('Error in updateTotalCost:', error);
    }
}

// Update the results in the UI
function updateResults(materialCost = 0, electricityCost = 0, laborCost = 0, packagingCost = 0, shippingCost = 0) {
    console.log('Updating results with:', { materialCost, electricityCost, laborCost, packagingCost, shippingCost });

    // Ensure we have valid numbers
    materialCost = parseFloat(materialCost) || 0;
    electricityCost = parseFloat(electricityCost) || 0;
    laborCost = parseFloat(laborCost) || 0;
    packagingCost = parseFloat(packagingCost) || 0;
    shippingCost = parseFloat(shippingCost) || 0;

    // Calculate base cost (sum of material, electricity, labor, packaging, and shipping costs)
    // These values already include quantity and failure rate multipliers
    // Calculate base cost (sum of all costs without margin)
    const baseCost = materialCost + electricityCost + laborCost + packagingCost + shippingCost;
    window.currentBaseCost = baseCost; // Store for pricing calculations
    
    console.log('Base cost components:', {
        materialCost,
        electricityCost,
        laborCost,
        packagingCost,
        shippingCost,
        totalBaseCost: baseCost
    });

    console.log('Base cost calculated:', {
        materialCost,
        electricityCost,
        laborCost,
        packagingCost,
        shippingCost,
        totalBaseCost: baseCost
    });

    // Format number helper function
    const formatNumber = (num) => {
        return num.toLocaleString(currentLang, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Update the base cost display
    const baseCostEl = document.getElementById('base-cost');
    if (baseCostEl) {
        baseCostEl.textContent = `€${formatNumber(baseCost)}`;
    }

    // Update the individual cost displays
    const materialCostEl = document.getElementById('material-cost');
    const electricityCostEl = document.getElementById('electricity-cost-result');
    const laborCostEl = document.getElementById('labor-cost-result');
    const packagingCostEl = document.getElementById('packaging-cost-result');
    const shippingCostEl = document.getElementById('shipping-cost-result');

    if (materialCostEl) materialCostEl.textContent = `€${formatNumber(materialCost)}`;
    if (electricityCostEl) electricityCostEl.textContent = `€${formatNumber(electricityCost)}`;
    if (laborCostEl) laborCostEl.textContent = `€${formatNumber(laborCost)}`;
    if (packagingCostEl) packagingCostEl.textContent = `€${formatNumber(packagingCost)}`;
    if (shippingCostEl) shippingCostEl.textContent = `€${formatNumber(shippingCost)}`;

    // Update the cost allocation chart with the latest values (without margin)
    updateCostAllocationChart(materialCost, electricityCost, laborCost, packagingCost, shippingCost, 0);

    // Update the suggested prices based on the new base cost
    updateSuggestedPrices(baseCost);

    // Force update the total cost with the latest base cost
    updateTotalCost();

    // Add animation to the results
    const resultsCard = document.querySelector('.results-card');
    if (resultsCard) {
        resultsCard.style.animation = 'none';
        void resultsCard.offsetWidth; // Trigger reflow
        resultsCard.style.animation = 'pulse 0.5s';
    }
}

// Export results as PDF
function exportToPdf() {
    // Get the export button and store its state
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const originalText = exportPdfBtn ? exportPdfBtn.innerHTML : 'Export PDF';
    
    // Show loading state if button exists
    if (exportPdfBtn) {
        exportPdfBtn.disabled = true;
        exportPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Generating PDF...';
    }
    
    try {

        // Create a new element for PDF content with compact styling
        const pdfContent = document.createElement('div');
        pdfContent.id = 'pdf-content';
        pdfContent.style.fontFamily = '"Roboto", "Helvetica", "Arial", sans-serif';
        pdfContent.style.width = '190mm'; // Slightly less than A4 width to account for margins
        pdfContent.style.margin = '5mm auto 5mm 10mm'; // More left margin to match right side
        pdfContent.style.padding = '8mm 8mm 8mm 0';
        pdfContent.style.color = '#424242';
        pdfContent.style.backgroundColor = '#ffffff';
        pdfContent.style.boxSizing = 'border-box';
        pdfContent.style.fontSize = '10pt'; // Smaller base font size
        
        // Get current date for the invoice
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        // Add compact header
        const header = document.createElement('div');
        header.style.backgroundColor = '#3f51b5';
        header.style.color = 'white';
        header.style.padding = '12px 16px';
        header.style.borderRadius = '2px';
        header.style.marginBottom = '12px';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        
        const logoSection = document.createElement('div');
        logoSection.innerHTML = `
            <h1 style="color: white; margin: 0; font-size: 18px; font-weight: 500; letter-spacing: 0.5px;">${companyName || '3D Printing'}</h1>
            <p style="margin: 2px 0 0 0; color: rgba(255,255,255,0.9); font-size: 11px; font-weight: 400;">3D Printing Cost Estimate</p>
        `;
        
        const invoiceInfo = document.createElement('div');
        invoiceInfo.style.textAlign = 'right';
        invoiceInfo.innerHTML = `
            <div style="background: rgba(255,255,255,0.1); display: inline-block; padding: 6px 10px; border-radius: 3px;">
                <p style="margin: 0 0 2px 0; font-weight: 500; font-size: 10px; color: rgba(255,255,255,0.9);">EST #${currentEstimateNumber}</p>
                <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 10px;">${formattedDate}</p>
            </div>
        `;
        
        header.appendChild(logoSection);
        header.appendChild(invoiceInfo);
        pdfContent.appendChild(header);
        
        // Compact project info section
        const infoSection = document.createElement('div');
        infoSection.style.backgroundColor = '#f8f9fa';
        infoSection.style.borderRadius = '2px';
        infoSection.style.padding = '12px 16px';
        infoSection.style.marginBottom = '12px';
        infoSection.style.borderLeft = '3px solid #3f51b5';
        
        const projectInfo = document.createElement('div');
        projectInfo.innerHTML = `
            <h3 style="color: #3f51b5; margin: 0 0 10px 0; font-size: 14px; font-weight: 500; display: flex; align-items: center;">
                <span style="display: inline-block; width: 6px; height: 6px; background: #3f51b5; border-radius: 50%; margin-right: 6px;"></span>
                PROJECT DETAILS
            </h3>
            <div style="display: flex; gap: 24px; font-size: 11px;">
                <div>
                    <p style="margin: 0 0 2px 0; color: #757575;">Print Time</p>
                    <p style="margin: 0 0 8px 0; font-weight: 500;">${printTimeInput ? printTimeInput.value : '0'} hours</p>
                </div>
                <div>
                    <p style="margin: 0 0 2px 0; color: #757575;">Quantity</p>
                    <p style="margin: 0 0 8px 0; font-weight: 500;">${quantityInput ? quantityInput.value : '1'}</p>
                </div>
            </div>
        `;
        
        infoSection.appendChild(projectInfo);
        pdfContent.appendChild(infoSection);
        
        // Compact materials section
        const materialsSection = document.createElement('div');
        materialsSection.style.marginBottom = '12px';
        
        let materialsTable = `
            <h3 style="color: #3f51b5; margin: 0 0 10px 0; font-size: 14px; font-weight: 500; display: flex; align-items: center;">
                <span style="display: inline-block; width: 6px; height: 6px; background: #3f51b5; border-radius: 50%; margin-right: 6px;"></span>
                MATERIALS
            </h3>
            <div style="overflow-x: auto; font-size: 10px;">
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0;">
                    <thead>
                        <tr>
                            <th style="text-align: left; padding: 8px 10px; color: #757575; font-weight: 500; border-bottom: 1px solid #e0e0e0; background: #f5f5f5;">MATERIAL</th>
                            <th style="text-align: left; padding: 8px 10px; color: #757575; font-weight: 500; border-bottom: 1px solid #e0e0e0; background: #f5f5f5;">COLOR</th>
                            <th style="text-align: right; padding: 8px 10px; color: #757575; font-weight: 500; border-bottom: 1px solid #e0e0e0; background: #f5f5f5;">WEIGHT</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        const materialRows = document.querySelectorAll('.material-row');
        materialRows.forEach(row => {
            const materialSelect = row.querySelector('select.material-select');
            const materialOption = materialSelect && materialSelect.selectedIndex >= 0 ? 
                materialSelect.options[materialSelect.selectedIndex] : null;
            const materialName = materialOption ? materialOption.text.split('(')[0].trim() : 'PLA';
            const materialColor = materialOption && materialOption.dataset.color ? 
                materialOption.dataset.color : '#CCCCCC';
            const materialWeight = row.querySelector('.material-weight') ? 
                (parseFloat(row.querySelector('.material-weight').value) || 0).toFixed(2) : '0.00';
            const materialUnit = row.querySelector('.material-unit') ? 
                row.querySelector('.material-unit').textContent : 'g';
            const quantity = parseFloat(quantityInput ? quantityInput.value : 1) || 1;
            const totalWeight = (parseFloat(materialWeight) * quantity).toFixed(2);
            
            materialsTable += `
                <tr>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; vertical-align: top; font-size: 10px;">
                        ${materialName}
                    </td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; vertical-align: top;">
                        <div style="width: 16px; height: 16px; border-radius: 2px; background-color: ${materialColor}; border: 1px solid #ddd;"></div>
                    </td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; text-align: right; vertical-align: top; font-size: 10px; font-family: monospace;">
                        ${materialWeight} ${materialUnit} × ${quantity} = <strong>${totalWeight} ${materialUnit}</strong>
                    </td>
                </tr>
            `;
        });
        
        materialsTable += `
                </tbody>
            </table>
        `;
        
        materialsSection.innerHTML = materialsTable;
        pdfContent.appendChild(materialsSection);
        
        // Compact costs section
        const costsSection = document.createElement('div');
        costsSection.style.marginBottom = '12px';
        
        const laborType = laborCalculationType ? laborCalculationType.options[laborCalculationType.selectedIndex].text : 'N/A';
        const packagingType = packagingCalculationType ? packagingCalculationType.options[packagingCalculationType.selectedIndex].text : 'N/A';
        const shippingType = shippingCalculationType ? shippingCalculationType.options[shippingCalculationType.selectedIndex].text : 'N/A';
        
        // Calculate per-unit costs
        const quantity = parseFloat(quantityInput ? quantityInput.value : 1) || 1;
        const laborHours = parseFloat(laborHoursInput ? laborHoursInput.value : 0) || 0;
        const packagingCost = parseFloat(packagingCostInput ? packagingCostInput.value : 0) || 0;
        const shippingCost = parseFloat(shippingCostInput ? shippingCostInput.value : 0) || 0;
        
        costsSection.innerHTML = `
            <h3 style="color: #3f51b5; margin: 0 0 10px 0; font-size: 14px; font-weight: 500; display: flex; align-items: center;">
                <span style="display: inline-block; width: 6px; height: 6px; background: #3f51b5; border-radius: 50%; margin-right: 6px;"></span>
                COST BREAKDOWN
            </h3>
            <div style="overflow-x: auto; font-size: 10px;">
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0; margin-bottom: 8px;">
                    <thead>
                        <tr>
                            <th style="text-align: left; padding: 8px 10px; color: #757575; font-weight: 500; border-bottom: 1px solid #e0e0e0; background: #f5f5f5;">ITEM</th>
                            <th style="text-align: right; padding: 8px 10px; color: #757575; font-weight: 500; border-bottom: 1px solid #e0e0e0; background: #f5f5f5;">UNIT PRICE</th>
                            <th style="text-align: right; padding: 8px 10px; color: #757575; font-weight: 500; border-bottom: 1px solid #e0e0e0; background: #f5f5f5;">QTY</th>
                            <th style="text-align: right; padding: 8px 10px; color: #757575; font-weight: 500; border-bottom: 1px solid #e0e0e0; background: #f5f5f5;">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; vertical-align: top;">
                                <div style="font-weight: 500;">Labor</div>
                                <div style="color: #757575; font-size: 9px;">${laborType}</div>
                            </td>
                            <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; text-align: right; vertical-align: top; font-family: monospace;">
                                ${(laborHours / quantity).toFixed(2)} h
                            </td>
                            <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; text-align: right; vertical-align: top; font-family: monospace;">
                                ${quantity}
                            </td>
                            <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; text-align: right; vertical-align: top; font-family: monospace;">
                                <strong>${laborHours.toFixed(2)} h</strong>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; vertical-align: top;">
                                <div style="font-weight: 500;">Packaging</div>
                                <div style="color: #757575; font-size: 9px;">${packagingType}</div>
                            </td>
                            <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; text-align: right; vertical-align: top; font-family: monospace;">
                                ${(packagingCost / quantity).toFixed(2)} €
                            </td>
                            <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; text-align: right; vertical-align: top; font-family: monospace;">
                                ${quantity}
                            </td>
                            <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; text-align: right; vertical-align: top; font-family: monospace;">
                                <strong>${packagingCost.toFixed(2)} €</strong>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; vertical-align: top;">
                                <div style="font-weight: 500;">Shipping</div>
                                <div style="color: #757575; font-size: 9px;">${shippingType}</div>
                            </td>
                            <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; text-align: right; vertical-align: top; font-family: monospace;">
                                ${(shippingCost / quantity).toFixed(2)} €
                            </td>
                            <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; text-align: right; vertical-align: top; font-family: monospace;">
                                ${quantity}
                            </td>
                            <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; text-align: right; vertical-align: top; font-family: monospace;">
                                <strong>${shippingCost.toFixed(2)} €</strong>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        pdfContent.appendChild(costsSection);
        
        // Add compact total amount
        const totalCostEl = document.getElementById('total-cost');
        if (totalCostEl) {
            const totalSection = document.createElement('div');
            totalSection.style.backgroundColor = '#f8f9fa';
            totalSection.style.borderRadius = '2px';
            totalSection.style.padding = '12px 16px';
            totalSection.style.marginTop = '8px';
            totalSection.style.textAlign = 'right';
            totalSection.style.borderTop = '2px solid #3f51b5';
            
            totalSection.innerHTML = `
                <div style="font-size: 11px; color: #757575; margin-bottom: 2px;">TOTAL AMOUNT</div>
                <div style="font-size: 20px; font-weight: 600; color: #3f51b5; font-family: monospace;">${totalCostEl.textContent}</div>
                <div style="font-size: 9px; color: #9e9e9e; margin-top: 2px;">
                    (${quantity} ${quantity === 1 ? 'piece' : 'pieces'})
                </div>
            `;
            pdfContent.appendChild(totalSection);
        }
        
        // Add compact footer
        const footer = document.createElement('div');
        footer.style.textAlign = 'center';
        footer.style.marginTop = '16px';
        footer.style.padding = '8px 0';
        footer.style.color = '#9e9e9e';
        footer.style.fontSize = '9px';
        footer.style.borderTop = '1px solid #f0f0f0';
        footer.innerHTML = `
            <div style="margin: 0 auto; padding: 0 8px;">
                <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 4px;">
                    <span style="color: #3f51b5; font-weight: 500; font-size: 10px;">3Dwork</span>
                    <span style="margin: 0 4px; color: #e0e0e0;">•</span>
                    <span style="font-size: 9px;">3D Cost Calculator</span>
                </div>
                <p style="margin: 0; color: #bdbdbd; font-size: 8px;">
                    <a href="https://3dwork.io" style="color: #3f51b5; text-decoration: none;">https://3dwork.io</a>
                </p>
                <p style="margin: 4px 0 0 0; color: #e0e0e0; font-size: 8px;">
                    Computer-generated document. No signature required.
                </p>
            </div>
        `;
        pdfContent.appendChild(footer);
        
        // Temporarily add to body for PDF generation
        document.body.appendChild(pdfContent);
        
        // Optimized PDF options for compact layout
        const opt = {
            margin: [5, 5, 5, 10], // Right margin increased to match left side
            filename: `3dwork-estimate-${currentEstimateNumber || new Date().getTime()}.pdf`,
            pagebreak: { 
                mode: ['avoid-all', 'css', 'legacy'],
                before: '.avoid-break',
                after: '.avoid-break'
            },
            image: { 
                type: 'jpeg', 
                quality: 0.9 
            },
            html2canvas: { 
                scale: 1.2, // Optimized scale for better fit
                useCORS: true,
                logging: false,
                allowTaint: true,
                backgroundColor: '#ffffff',
                letterRendering: true,
                scrollX: 0,
                scrollY: 0
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4',
                orientation: 'portrait',
                hotfixes: ['px_scaling'],
                putOnlyUsedFonts: true,
                precision: 2 // Reduce precision to save space if needed
            },
            onclone: function(clonedDoc) {
                // Force single page
                clonedDoc.body.style.overflow = 'hidden';
                const content = clonedDoc.getElementById('pdf-content');
                if (content) {
                    content.style.maxHeight = '287mm'; // A4 height - minimal margins
                    content.style.overflow = 'hidden';
                }
                
                // Add page break prevention classes
                const sections = clonedDoc.querySelectorAll('div > div');
                sections.forEach((section, index) => {
                    if (index > 0) {
                        section.classList.add('avoid-break');
                    }
                });
            }
        };

        // Generate PDF
        html2pdf()
            .set(opt)
            .from(pdfContent)
            .save()
            .then(() => {
                // Clean up
                document.body.removeChild(pdfContent);
                
                // Restore button state if button exists
                if (exportPdfBtn) {
                    exportPdfBtn.disabled = false;
                    exportPdfBtn.innerHTML = originalText;
                }
                
                // Show success message
                const alert = document.createElement('div');
                alert.className = 'alert alert-success mt-3';
                alert.role = 'alert';
                alert.innerHTML = 'PDF generated successfully!';
                document.querySelector('.results-card').parentNode.insertBefore(alert, document.querySelector('.results-card').nextSibling);
                
                // Remove alert after 3 seconds
                setTimeout(() => alert.remove(), 3000);
            })
            .catch(err => {
                console.error('Error generating PDF:', err);
                handlePdfError(originalText, exportPdfBtn, 'Error generating PDF. Please try again.');
            });
            
        // Return the promise for better error handling
        return true;
    } catch (err) {
        console.error('Unexpected error in exportToPdf:', err);
        const btnText = exportPdfBtn ? exportPdfBtn.textContent : 'Export PDF';
        handlePdfError(btnText, exportPdfBtn, 'An unexpected error occurred. Please check the console for details.');
    }
}

function handlePdfError(originalText, buttonElement, message) {
    // Restore button state if button element exists
    if (buttonElement) {
        buttonElement.disabled = false;
        buttonElement.innerHTML = originalText || 'Export PDF';
    }
    
    try {
        // Show error message
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger mt-3';
        alert.role = 'alert';
        alert.innerHTML = message;
        
        // Try to find a good place to insert the alert
        const resultsCard = document.querySelector('.results-card');
        if (resultsCard && resultsCard.parentNode) {
            resultsCard.parentNode.insertBefore(alert, resultsCard.nextSibling);
        } else if (buttonElement && buttonElement.parentNode) {
            buttonElement.parentNode.insertBefore(alert, buttonElement.nextSibling);
        } else {
            document.body.insertBefore(alert, document.body.firstChild);
        }
        
        // Remove alert after 5 seconds
        setTimeout(() => {
            if (alert && alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    } catch (err) {
        console.error('Error showing error message:', err);
        // Fallback to alert if DOM manipulation fails
        alert(message);
    }
}}
