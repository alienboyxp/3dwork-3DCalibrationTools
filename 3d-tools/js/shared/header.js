// =====================================================
// header.js — Header/nav compartido para todas las apps 3Dwork
// Incluir con <script src="js/shared/header.js"></script>
// Soporta ?noheader=1 para ocultar el header (WordPress/iframe)
// =====================================================

window.SharedHeader = (function () {
    // ¿Ocultar el header? (?noheader=1 en la URL)
    const shouldHide = () => {
        try {
            const p = new URLSearchParams(window.location.search);
            return p.get('noheader') === '1';
        } catch (e) { return false; }
    };

    // Detectar idioma del navegador (una vez, compartido)
    const detectLang = () => {
        const saved = localStorage.getItem('3dwork_lang');
        if (saved) return saved;
        const nav = (navigator.language || 'en').toLowerCase();
        return nav.startsWith('es') ? 'es' : 'en';
    };

    let currentLang = detectLang();

    const setLang = (lang) => {
        currentLang = lang;
        localStorage.setItem('3dwork_lang', lang);
        if (window.i18next) window.i18next.changeLanguage(lang);
        document.dispatchEvent(new CustomEvent('3dwork:langchange', { detail: { lang } }));
    };

    // Resolver ruta relativa a la raíz de tools/
    // Funciona tanto si el servidor sirve desde 3d-tools/ como desde un subdirectorio
    const toolsRoot = () => {
        // Si estamos en la raíz (index.html) → ./
        // Si estamos en una subpágina (litho.html, hueforge.html) → ./
        // Si estamos en apps/clicker/index.html → ../../
        const path = window.location.pathname;
        if (path.includes('/apps/')) return '../../';
        return './';
    };

    const Header = function Header({ active }) {
        const root = toolsRoot();
        const [lang, setLangState] = React.useState(currentLang);
        const [dropdownOpen, setDropdownOpen] = React.useState(null);
        const [navOpen, setNavOpen] = React.useState(false);

        React.useEffect(() => {
            const onChange = (e) => setLangState(e.detail.lang);
            document.addEventListener('3dwork:langchange', onChange);
            return () => document.removeEventListener('3dwork:langchange', onChange);
        }, []);

        // Cerrar dropdown al hacer click fuera
        React.useEffect(() => {
            const close = (e) => {
                if (!e.target.closest('.dropdown')) setDropdownOpen(null);
            };
            document.addEventListener('click', close);
            return () => document.removeEventListener('click', close);
        }, []);

        if (shouldHide()) return null;

        const isEN = lang === 'en';

        const menuItems = {
            home: isEN ? 'Home' : 'Inicio',
            calibration: 'Calibration',
            create: isEN ? 'Create' : 'Crear',
            price: isEN ? '3D Print Price Calculator' : 'Calculadora de Precio',
            comparators: isEN ? 'Comparators' : 'Comparadores',
        };

        const calibItems = [
            { href: root + '../#esteps', label: 'E-steps Calibration' },
            { href: root + '../#rotation', label: 'Rotation Distance' },
            { href: root + '../#skew', label: 'Skew Calibration' },
            { href: root + '../#bedmesh', label: 'Bed Mesh Alignment' },
            { href: root + '../#bedleveling', label: 'Manual Bed Leveling' },
            { href: root + '../#vref', label: 'Vref & RMS Calculator' },
            { href: root + '../#shaper', label: 'Input Shaper Analysis' },
            { href: root + '../#loganalyzer', label: 'Log Analyzer & AI Support' },
        ];

        const createItems = [
            { href: root + 'litho.html', label: 'Lithophane Creator', active: active === 'litho' },
            { href: root + 'hueforge.html', label: 'HueForge Creator', active: active === 'hueforge' },
            { href: root + 'apps/clicker/index.html', label: 'Clicker Factory', active: active === 'clicker' },
        ];

        const compItems = [
            { href: root + '../#comparator', label: isEN ? 'Machines' : 'Máquinas' },
            { href: root + '../#filaments', label: isEN ? 'Filaments' : 'Filamentos' },
            { href: root + '../#resins', label: isEN ? 'Resins' : 'Resinas' },
        ];

        return (
            <header>
                <nav id="top-nav">
                    <a href={root + '../index.html'} className="logo-container">
                        <img src="https://3dwork.io/wp-content/uploads/2023/07/3dwork_white_logo.png" alt="3Dwork Logo" className="logo-img" />
                    </a>
                    <button className="nav-toggle" aria-label="Menu" onClick={() => setNavOpen(!navOpen)}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
                    </button>
                    <ul className={'nav-links' + (navOpen ? ' open' : '')}>
                        <li><a href={root + '../index.html'}>{menuItems.home}</a></li>
                        <li className={'dropdown' + (dropdownOpen === 'cal' ? ' open' : '')}>
                            <a href="#" className="dropdown-trigger" onClick={(e) => { e.preventDefault(); setDropdownOpen(dropdownOpen === 'cal' ? null : 'cal'); }}>
                                {menuItems.calibration} <i data-lucide="chevron-down"></i>
                            </a>
                            <ul className="dropdown-menu">
                                {calibItems.map((it, i) => <li key={i}><a href={it.href}>{it.label}</a></li>)}
                            </ul>
                        </li>
                        <li className={'dropdown' + (dropdownOpen === 'create' ? ' open' : '')}>
                            <a href="#" className="dropdown-trigger" onClick={(e) => { e.preventDefault(); setDropdownOpen(dropdownOpen === 'create' ? null : 'create'); }}>
                                {menuItems.create} <i data-lucide="chevron-down"></i>
                            </a>
                            <ul className="dropdown-menu">
                                {createItems.map((it, i) => <li key={i}><a href={it.href} style={it.active ? { color: 'var(--accent)' } : {}}>{it.label}</a></li>)}
                            </ul>
                        </li>
                        <li><a href={root + '../index.html#price'}>{menuItems.price}</a></li>
                        <li className={'dropdown' + (dropdownOpen === 'comp' ? ' open' : '')}>
                            <a href="#" className="dropdown-trigger" onClick={(e) => { e.preventDefault(); setDropdownOpen(dropdownOpen === 'comp' ? null : 'comp'); }}>
                                {menuItems.comparators} <i data-lucide="chevron-down"></i>
                            </a>
                            <ul className="dropdown-menu">
                                {compItems.map((it, i) => <li key={i}><a href={it.href}>{it.label}</a></li>)}
                            </ul>
                        </li>
                    </ul>
                    <div className="nav-right" style={{ display: 'flex', gap: 10 }}>
                        <button
                            className="v-btn" style={{
                                background: isEN ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                borderRadius: 8,
                                fontSize: '0.8rem',
                                padding: '4px 10px',
                            }}
                            onClick={() => setLang('en')}
                        >🇬🇧 EN</button>
                        <button
                            className="v-btn" style={{
                                background: !isEN ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                borderRadius: 8,
                                fontSize: '0.8rem',
                                padding: '4px 10px',
                            }}
                            onClick={() => setLang('es')}
                        >🇪🇸 ES</button>
                    </div>
                </nav>
            </header>
        );
    };

    return { Header, shouldHide, setLang, getLang: () => currentLang };
})();
