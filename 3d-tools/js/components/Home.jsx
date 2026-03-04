// =====================================================
// Home.jsx – Landing page / Dashboard
// 50/50 column layout with tool entry cards
// =====================================================

window.Home = function Home({ onNavigate }) {
    const { t } = ReactI18next.useTranslation();

    return (
        <div className="home-page">
            <div className="home-hero">
                <h1>{t('home_title')}</h1>
                <p>{t('home_subtitle')}</p>
            </div>

            <div className="tools-grid">

                {/* ══ Lithophane Card ══ */}
                <div className="tool-entry-card litho" onClick={() => onNavigate('lithophane')}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div className="tool-entry-icon orange">🖼️</div>
                        <span className="tool-badge orange">
                            <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" /></svg>
                            3D Print Tool
                        </span>
                    </div>

                    <div className="tool-entry-info">
                        <h2>{t('litho_title')}</h2>
                        <p>{t('litho_desc')}</p>
                    </div>

                    <ul className="tool-feature-list">
                        {[
                            t('litho_f1'), t('litho_f2'), t('litho_f3'),
                            t('litho_f4'), t('litho_f5')
                        ].map((f, i) => <li key={i}>{f}</li>)}
                    </ul>

                    <button className="tool-cta orange" onClick={e => { e.stopPropagation(); onNavigate('lithophane'); }}>
                        <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                        {t('litho_cta')}
                    </button>
                </div>

                {/* ══ HueForge Card ══ */}
                <div className="tool-entry-card hueforge" onClick={() => onNavigate('hueforge')}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div className="tool-entry-icon blue">🎨</div>
                        <span className="tool-badge blue">
                            <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" /></svg>
                            Color Painting
                        </span>
                    </div>

                    <div className="tool-entry-info">
                        <h2>{t('hueforge_title')}</h2>
                        <p>{t('hueforge_desc')}</p>
                    </div>

                    <ul className="tool-feature-list">
                        {[
                            t('hueforge_f1'), t('hueforge_f2'), t('hueforge_f3'),
                            t('hueforge_f4'), t('hueforge_f5')
                        ].map((f, i) => <li key={i}>{f}</li>)}
                    </ul>

                    <button className="tool-cta blue" onClick={e => { e.stopPropagation(); onNavigate('hueforge'); }}>
                        <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                        {t('hueforge_cta')}
                    </button>
                </div>

            </div>

            {/* Footer note */}
            <div style={{
                marginTop: '3rem',
                textAlign: 'center',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                lineHeight: 1.8,
            }}>
                <p>All processing is done 100% locally in your browser — no data is sent to any server.</p>
                <p style={{ marginTop: '0.35rem' }}>
                    Part of{' '}
                    <a href="https://3dwork.io" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 700 }}>
                        3Dwork.io
                    </a>{' '}
                    Advanced 3D Printing Calibration Tools
                </p>
            </div>
        </div>
    );
};
