// =====================================================
// App.jsx – Root application component
// Handles routing (Home / Lithophane / HueForge)
// and the top navigation bar
// =====================================================

window.App = function App() {
    const { t, i18n } = ReactI18next.useTranslation();
    const [view, setView] = React.useState('home');    // 'home' | 'lithophane' | 'hueforge'
    const [lang, setLang] = React.useState(window.__i18nLang || 'en');

    // Sync language with i18next
    const handleLangChange = (l) => {
        setLang(l);
        window.changeLanguage(l);
        i18n.changeLanguage(l);
    };

    // Listen for i18n changes (from external triggering)
    React.useEffect(() => {
        const onChanged = (e) => setLang(e.detail);
        document.addEventListener('i18nChanged', onChanged);
        return () => document.removeEventListener('i18nChanged', onChanged);
    }, []);

    // Tab labels for nav
    const navTabs = [
        { id: 'home', labelKey: null, label: '⌂ Home' },
        { id: 'lithophane', labelKey: 'nav_litho' },
        { id: 'hueforge', labelKey: 'nav_hueforge' },
    ];

    return (
        <div id="app">
            {/* ════ TOP NAVIGATION ════ */}
            <nav className="app-nav">
                {/* Logo */}
                <a href="https://3dwork.io" target="_blank" rel="noreferrer" className="nav-logo">
                    <img
                        src="https://3dwork.io/wp-content/uploads/2023/07/3dwork_white_logo.png"
                        alt="3Dwork.io"
                        onError={e => { e.target.style.display = 'none'; }}
                    />
                    <span className="nav-logo-text">3D<span>work</span>.io</span>
                </a>

                {/* Tab navigation (only show on non-home) */}
                <div className="nav-tabs">
                    <button
                        className={`nav-tab${view === 'home' ? ' active' : ''}`}
                        onClick={() => setView('home')}
                    >
                        ⌂ Home
                    </button>
                    <button
                        className={`nav-tab${view === 'lithophane' ? ' active' : ''}`}
                        onClick={() => setView('lithophane')}
                    >
                        {t('nav_litho')}
                    </button>
                    <button
                        className={`nav-tab${view === 'hueforge' ? ' active' : ''}`}
                        onClick={() => setView('hueforge')}
                    >
                        {t('nav_hueforge')}
                    </button>
                </div>

                {/* Language + back link */}
                <div className="nav-right">
                    <button
                        className={`lang-btn${lang === 'en' ? ' active' : ''}`}
                        onClick={() => handleLangChange('en')}
                    >
                        🇬🇧 EN
                    </button>
                    <button
                        className={`lang-btn${lang === 'es' ? ' active' : ''}`}
                        onClick={() => handleLangChange('es')}
                    >
                        🇪🇸 ES
                    </button>
                    <a href="../index.html" className="back-btn">
                        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
                        Main Site
                    </a>
                </div>
            </nav>

            {/* ════ PAGE CONTENT ════ */}
            <div className="page-content">
                {view === 'home' && <window.Home onNavigate={setView} />}
                {view === 'lithophane' && <window.LithophaneTool onNavigate={setView} />}
                {view === 'hueforge' && <window.HueForgeTool onNavigate={setView} />}
            </div>
        </div>
    );
};
