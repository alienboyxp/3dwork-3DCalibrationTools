// =====================================================
// main.jsx – React app entry point
// Waits for i18n to be ready before mounting
// =====================================================

(function mountApp() {
    // react-i18next setup
    const { I18nextProvider, initReactI18next } = ReactI18next;

    i18next.use(initReactI18next);

    const mount = () => {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(
            React.createElement(
                I18nextProvider,
                { i18n: i18next },
                React.createElement(window.App, null)
            )
        );
    };

    if (window.__i18nReady) {
        mount();
    } else {
        document.addEventListener('i18nReady', mount, { once: true });
    }
})();
