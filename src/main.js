let currentLang = 'en';
let currentView = 'home';

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

    renderView();
    updateActiveNavItem();

    // Auto-scroll to top on navigation
    window.scrollTo(0, 0);
}

function setupLangButtons() {
    const btnEn = document.getElementById('btn-en');
    const btnEs = document.getElementById('btn-es');

    if (btnEn) btnEn.addEventListener('click', () => switchLang('en'));
    if (btnEs) btnEs.addEventListener('click', () => switchLang('es'));
}

function switchLang(lang) {
    currentLang = lang;
    const btnEn = document.getElementById('btn-en');
    const btnEs = document.getElementById('btn-es');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
    if (btnEs) btnEs.classList.toggle('active', lang === 'es');

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
        // Keep the icon if it exists
        const icon = navCalibrationMenu.querySelector('i');
        navCalibrationMenu.textContent = t.calibrationMenu + ' ';
        if (icon) navCalibrationMenu.appendChild(icon);
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
    } else {
        // Fallback to home
        window.renderHome(content, t);
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

document.addEventListener('DOMContentLoaded', init);
