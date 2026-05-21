let currentLang = 'en';
let currentView = 'home';

const TOOL_TITLES = {
    en: {
        home:        '3Dwork Tools — 3D Printer Calibration Tools',
        esteps:      'E-steps Calibration Calculator | 3Dwork',
        rotation:    'Rotation Distance Calculator | 3Dwork',
        skew:        'Skew Correction Calculator | 3Dwork',
        bedmesh:     'Bed Mesh Alignment | 3Dwork',
        bedleveling: 'Manual Bed Leveling | 3Dwork',
        vref:        'Vref & RMS Calculator | 3Dwork',
        shaper:      'Input Shaper Analysis | 3Dwork',
        loganalyzer: 'Klipper Log Analyzer | 3Dwork',
        price:       '3D Printing Price Calculator | 3Dwork',
        filaments:   '3D Filament Database | 3Dwork',
        comparator:  '3D Printer Comparator | 3Dwork',
    },
    es: {
        home:        '3Dwork Tools — Herramientas calibración impresoras 3D',
        esteps:      'Calculadora E-steps Extrusor | 3Dwork',
        rotation:    'Calculadora Rotation Distance | 3Dwork',
        skew:        'Calculadora Corrección Skew | 3Dwork',
        bedmesh:     'Alineación Bed Mesh | 3Dwork',
        bedleveling: 'Nivelación Manual Cama | 3Dwork',
        vref:        'Calculadora Vref y RMS Drivers | 3Dwork',
        shaper:      'Análisis Input Shaper | 3Dwork',
        loganalyzer: 'Analizador Logs Klipper | 3Dwork',
        price:       'Calculadora Precio Impresión 3D | 3Dwork',
        filaments:   'Base de Datos Filamentos 3D | 3Dwork',
        comparator:  'Comparador Impresoras 3D | 3Dwork',
    }
};

function init() {
    setupLangButtons();
    setupNavigation();

    // Initial routing based on hash or default
    handleRouting();

    // Listen for hash changes
    window.addEventListener('hashchange', handleRouting);

    // Initial UI update
    updateUILabels();
}

function handleRouting() {
    // Basic hash-based router
    const hash = window.location.hash.replace('#', '');
    currentView = hash || 'home';

    if (currentView === 'lithophane' || currentView === 'hueforge') {
        const toolHash = currentView === 'lithophane' ? '#litho' : '#hue';
        window.location.href = `3d-tools/index.html${toolHash}`;
        return;
    }

    updatePageTitle();
    renderView();
    updateActiveNavItem();

    // Google Analytics Tracking
    if (typeof gtag === 'function') {
        gtag('event', 'page_view', {
            page_title: document.title,
            page_path: '/' + currentView,
            page_location: window.location.href
        });
    }

    // Auto-scroll to top on navigation
    window.scrollTo(0, 0);
}

function updatePageTitle() {
    const titles = TOOL_TITLES[currentLang] || TOOL_TITLES.en;
    document.title = titles[currentView] || titles.home;
}

function setupLangButtons() {
    const btnEn = document.getElementById('btn-en');
    const btnEs = document.getElementById('btn-es');

    if (btnEn) btnEn.addEventListener('click', () => switchLang('en'));
    if (btnEs) btnEs.addEventListener('click', () => switchLang('es'));
}

function switchLang(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    const btnEn = document.getElementById('btn-en');
    const btnEs = document.getElementById('btn-es');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
    if (btnEs) btnEs.classList.toggle('active', lang === 'es');

    updatePageTitle();
    updateUILabels();
    renderView();
}

function setupNavigation() {
    // Navigation is handled via <a href="#id"> in HTML and hashchange listener
}

function updateUILabels() {
    if (!window.translations) return;
    const t = window.translations[currentLang];
    if (!t) return;

    const navHome = document.getElementById('nav-home');
    const navCalibrationMenu = document.getElementById('nav-calibration-menu');
    const navEsteps = document.getElementById('nav-esteps');
    const navRotation = document.getElementById('nav-rotation');
    const navSkew = document.getElementById('nav-skew');
    const navPrice = document.getElementById('nav-price');

    if (navHome) navHome.textContent = 'Home'; // Could be localized if needed
    if (navCalibrationMenu) {
        const icon = navCalibrationMenu.querySelector('i');
        navCalibrationMenu.textContent = t.calibrationMenu + ' ';
        if (icon) navCalibrationMenu.appendChild(icon);
    }
    const navCreateMenu = document.getElementById('nav-create-menu');
    if (navCreateMenu) {
        const icon = navCreateMenu.querySelector('i');
        navCreateMenu.textContent = t.createMenu + ' ';
        if (icon) navCreateMenu.appendChild(icon);
    }
    if (navEsteps) navEsteps.textContent = t.esteps;
    if (navRotation) navRotation.textContent = t.rotation;
    if (navSkew) navSkew.textContent = t.skew;
    if (navPrice) navPrice.textContent = t.priceCalculator;
    const navBedMesh = document.getElementById('nav-bedmesh');
    if (navBedMesh) navBedMesh.textContent = t.bedMeshTitle;

    const navBedLeveling = document.getElementById('nav-bedleveling');
    if (navBedLeveling) navBedLeveling.textContent = t.manualLevelingTitle;

    const navVref = document.getElementById('nav-vref');
    if (navVref) navVref.textContent = t.vrefTitle;

    const navShaper = document.getElementById('nav-shaper');
    if (navShaper) navShaper.textContent = t.shaperTitle;

    const navLithophane = document.getElementById('nav-lithophane');
    if (navLithophane) navLithophane.textContent = t.lithophaneTitle;

    const navHueForge = document.getElementById('nav-hueforge');
    if (navHueForge) navHueForge.textContent = t.hueforgeTitle;

    const navLitho = document.getElementById('nav-lithophane');
    if (navLitho) navLitho.textContent = t.lithophaneTitle;

    const navHue = document.getElementById('nav-hueforge');
    if (navHue) navHue.textContent = t.hueforgeTitle;

    const navLogAnalyzer = document.getElementById('nav-loganalyzer');
    if (navLogAnalyzer) navLogAnalyzer.textContent = t.logAnalyzerTitle;

    const navComparator = document.getElementById('nav-comparator');
    if (navComparator) navComparator.textContent = t.comparatorTitle || (window.currentLang === 'es' ? 'Comparador' : 'Comparator');

    const navFilaments = document.getElementById('nav-filaments');
    if (navFilaments) navFilaments.textContent = t.filamentsTitle || (window.currentLang === 'es' ? 'Filamentos' : 'Filaments');

    const footerText = document.getElementById('footer-contact-text');
    if (footerText) footerText.innerHTML = t.footerContact;

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function updateActiveNavItem() {
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));

    const hash = window.location.hash || '#home';
    const activeLink = document.querySelector(`.nav-links a[href="${hash}"]`);
    if (activeLink) {
        activeLink.classList.add('active');

        // If it's a sub-item, also highlight the parent trigger
        const dropdown = activeLink.closest('.dropdown');
        if (dropdown) {
            const trigger = dropdown.querySelector('.dropdown-trigger');
            if (trigger) trigger.classList.add('active');
        }
    } else if (hash === '#home') {
        const homeLink = document.getElementById('nav-home');
        if (homeLink) homeLink.classList.add('active');
    }
}

function renderView() {
    const content = document.getElementById('content');
    if (!content) return;

    if (!window.translations) return;
    const t = window.translations[currentLang];
    if (!t) return;

    // Clear content first
    content.innerHTML = '';
    // Reset any view-specific style overrides
    content.style.maxWidth = '';
    content.style.width = '';
    content.style.padding = '';

    if (currentView === 'home' && window.renderHome) {
        window.renderHome(content, t);
    } else if (currentView === 'esteps' && window.renderEsteps) {
        window.renderEsteps(content, t);
    } else if (currentView === 'rotation' && window.renderRotation) {
        window.renderRotation(content, t);
    } else if (currentView === 'skew' && window.renderSkew) {
        window.renderSkew(content, t);
    } else if (currentView === 'price' && window.renderPriceCalculator) {
        window.renderPriceCalculator(content, t);
    } else if (currentView === 'bedmesh' && window.renderBedMesh) {
        window.renderBedMesh(content, t);
    } else if (currentView === 'bedleveling' && window.renderBedLeveling) {
        window.renderBedLeveling(content, t);
    } else if (currentView === 'vref' && window.renderVref) {
        window.renderVref(content, t);
    } else if (currentView === 'shaper' && window.renderShaper) {
        window.renderShaper(content, t);
    } else if (currentView === 'loganalyzer' && window.renderLogAnalyzer) {
        window.renderLogAnalyzer(content, t);
    } else if (currentView === 'comparator' && window.renderComparator) {
        content.style.maxWidth = '1200px';
        window.renderComparator(content, t);
    } else if (currentView === 'filaments' && window.renderFilamentComparator) {
        // Render filamentComparator directly instead of iframe (fixes position:fixed floating bar)
        content.style.maxWidth = '100%';
        window.renderFilamentComparator(content, t);
    } else {
        // Fallback to home
        window.renderHome(content, t);
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

document.addEventListener('DOMContentLoaded', init);
