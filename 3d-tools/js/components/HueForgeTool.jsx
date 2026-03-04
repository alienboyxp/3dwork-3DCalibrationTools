// =====================================================
// HueForgeTool.jsx – Full HueForge Simulator UI
// =====================================================

window.HueForgeTool = function HueForgeTool({ onNavigate }) {
    const { t } = ReactI18next.useTranslation();

    // Filaments database
    const [filaments, setFilaments] = React.useState([]);
    const [brandFilter, setBrandFilter] = React.useState('All');
    const [searchQuery, setSearchQuery] = React.useState('');

    // Active layers (user-selected stack)
    const [layers, setLayers] = React.useState([
        { id: 'l1', brand: 'Elegoo', type: 'Rapid PLA+', colorName: 'Black', hex: '#0D0D0D', td: 1.2, startMm: 0.0 },
        { id: 'l2', brand: 'Elegoo', type: 'PLA', colorName: 'Blue', hex: '#1F618D', td: 3.5, startMm: 1.0 },
        { id: 'l3', brand: 'Anycubic', type: 'PLA', colorName: 'Orange', hex: '#E67E22', td: 2.8, startMm: 1.8 },
        { id: 'l4', brand: 'Spectrum', type: 'PLA Premium', colorName: 'Polar White', hex: '#FEFEFE', td: 5.3, startMm: 2.5 },
    ]);

    // Image
    const [imageUrl, setImageUrl] = React.useState(null);
    const geoRef = React.useRef(null);

    // Load filaments JSON
    React.useEffect(() => {
        fetch('../assets/data/filaments.json')
            .then(r => r.json())
            .then(data => setFilaments(data))
            .catch(() => {
                // Fallback minimal data if fetch fails
                setFilaments([
                    { id: 'fallback-black', brand: 'Generic', type: 'PLA', colorName: 'Black', hex: '#111111', td: 1.0 },
                    { id: 'fallback-white', brand: 'Generic', type: 'PLA', colorName: 'White', hex: '#F8F8F8', td: 5.0 },
                    { id: 'fallback-orange', brand: 'Generic', type: 'PLA', colorName: 'Orange', hex: '#E67E22', td: 2.8 },
                    { id: 'fallback-blue', brand: 'Generic', type: 'PLA', colorName: 'Blue', hex: '#2471A3', td: 3.3 },
                ]);
            });
    }, []);

    // Computed: unique brands
    const brands = React.useMemo(() => {
        const b = [...new Set(filaments.map(f => f.brand))];
        return [t('brand_all'), ...b];
    }, [filaments, t]);

    // Filtered filaments
    const filteredFilaments = React.useMemo(() => {
        return filaments.filter(f => {
            const matchBrand = brandFilter === 'All' || brandFilter === t('brand_all') || f.brand === brandFilter;
            const q = searchQuery.toLowerCase();
            const matchSearch = !q || f.colorName.toLowerCase().includes(q) || f.brand.toLowerCase().includes(q) || f.type.toLowerCase().includes(q);
            return matchBrand && matchSearch;
        });
    }, [filaments, brandFilter, searchQuery, t]);

    // Add a filament as new layer
    const addLayer = (filament) => {
        const maxStart = layers.length > 0 ? Math.max(...layers.map(l => l.startMm)) + 0.8 : 0;
        const newLayer = {
            id: 'l' + Date.now(),
            brand: filament.brand,
            type: filament.type,
            colorName: filament.colorName,
            hex: filament.hex,
            td: filament.td,
            startMm: parseFloat(maxStart.toFixed(2))
        };
        setLayers(prev => [...prev, newLayer]);
    };

    const removeLayer = (id) => {
        setLayers(prev => prev.filter(l => l.id !== id));
    };

    const updateLayerStart = (id, val) => {
        setLayers(prev => prev.map(l => l.id === id ? { ...l, startMm: parseFloat(val) } : l));
    };

    // M600 color change heights (slicer commands)
    const m600Heights = React.useMemo(() => {
        const sorted = [...layers].sort((a, b) => a.startMm - b.startMm);
        return sorted.slice(1).map((l, i) => ({
            colorName: l.colorName,
            hex: l.hex,
            height: l.startMm,
            fromColor: sorted[i].colorName
        }));
    }, [layers]);

    // Image load
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageUrl(URL.createObjectURL(file));
    };

    // Generate HueForge STL
    const handleGenerateSTL = () => {
        if (!geoRef.current) {
            // Build a simple flat plane if no geometry yet
            const geo = new THREE.PlaneGeometry(80, 80, 60, 60);
            const buf = window.STLExporterUtil.exportToBinarySTL(geo);
            window.STLExporterUtil.download(buf, '3dwork_hueforge.stl');
            return;
        }
        const buf = window.STLExporterUtil.exportToBinarySTL(geoRef.current);
        window.STLExporterUtil.download(buf, '3dwork_hueforge.stl');

        // Also generate guide text
        const guide = generateM600Guide();
        const blob = new Blob([guide], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = '3dwork_hueforge_guide.txt'; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const generateM600Guide = () => {
        const sorted = [...layers].sort((a, b) => a.startMm - b.startMm);
        let txt = '3Dwork.io - HueForge Color Change Guide\n';
        txt += '=========================================\n\n';
        txt += 'Layer 0 (Base):\n';
        sorted.forEach((l, i) => {
            if (i === 0) {
                txt += `  Filament: ${l.brand} ${l.colorName} (${l.type}), TD: ${l.td}\n`;
                txt += `  Height:   0.00mm\n\n`;
            } else {
                txt += `Color Change #${i} → ${l.colorName}:\n`;
                txt += `  Filament: ${l.brand} ${l.colorName} (${l.type}), TD: ${l.td}\n`;
                txt += `  Height:   ${l.startMm.toFixed(2)}mm\n`;
                txt += `  Slicer:   Add M600 at Z=${l.startMm.toFixed(2)}\n\n`;
            }
        });
        txt += '\nGenerated by 3Dwork.io – Advanced 3D Printing Tools\n';
        txt += 'https://3dwork.io\n';
        return txt;
    };

    const layersSorted = React.useMemo(() => [...layers].sort((a, b) => b.startMm - a.startMm), [layers]);

    return (
        <div className="tool-page">
            <div className="tool-layout" style={{ height: '100%' }}>

                {/* ════ LEFT PANEL – Layer Manager ════ */}
                <div className="panel-left">
                    <div className="panel-header">
                        <span className="panel-title">{t('hueforge_panel_left')}</span>
                    </div>
                    <div className="panel-body">

                        {/* Image upload */}
                        <label
                            className={`upload-zone${imageUrl ? ' has-image' : ''}`}
                            style={{ aspectRatio: '16/9' }}
                        >
                            {imageUrl && <img src={imageUrl} alt="Source" />}
                            {!imageUrl && (
                                <>
                                    <span className="upload-icon">🖼️</span>
                                    <span className="upload-zone-text">{t('hueforge_upload')}</span>
                                </>
                            )}
                            <input type="file" accept="image/*" onChange={handleFileChange} />
                        </label>

                        <div className="section-label">Filament Layers (top → bottom)</div>

                        {layers.length === 0 ? (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                                {t('hueforge_layers_empty')}
                            </div>
                        ) : (
                            <div className="layer-list">
                                {layersSorted.map(layer => (
                                    <div key={layer.id} className="layer-item">
                                        <div className="layer-swatch" style={{ background: layer.hex }} />
                                        <div className="layer-info">
                                            <div className="layer-name">{layer.colorName}</div>
                                            <div className="layer-details">
                                                {layer.brand} · {t('hueforge_td_label')}: {layer.td} · {t('hueforge_layer_start')}: {layer.startMm}mm
                                            </div>
                                            <input
                                                type="range"
                                                className="layer-start-slider"
                                                min={0} max={10} step={0.1}
                                                value={layer.startMm}
                                                onChange={e => updateLayerStart(layer.id, e.target.value)}
                                                style={{ marginTop: '0.4rem', width: '100%', height: '4px' }}
                                            />
                                        </div>
                                        <button className="layer-remove" onClick={() => removeLayer(layer.id)}>×</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* M600 Guide */}
                        {m600Heights.length > 0 && (
                            <div className="m600-guide">
                                <div className="m600-title">{t('hueforge_color_changes')}</div>
                                {m600Heights.map((ch, i) => (
                                    <div className="m600-row" key={i}>
                                        <span className="m600-label">
                                            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: ch.hex, marginRight: 6, border: '1px solid rgba(255,255,255,0.2)', verticalAlign: 'middle' }}></span>
                                            {ch.colorName}
                                        </span>
                                        <span className="m600-value">Z={ch.height.toFixed(2)}mm</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Generate Button */}
                        <button className="generate-btn" onClick={handleGenerateSTL}>
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                            {t('hueforge_generate')}
                        </button>
                    </div>
                </div>

                {/* ════ CENTER – 3D Preview ════ */}
                <div style={{ position: 'relative', background: '#080E1A' }}>
                    <div style={{
                        position: 'absolute', top: '0.75rem', left: '50%', transform: 'translateX(-50%)',
                        zIndex: 10, display: 'flex', gap: '0.5rem', alignItems: 'center'
                    }}>
                        <button className="light-source-btn" style={{ cursor: 'default' }}>
                            <span className="dot" style={{ background: 'var(--blue)', boxShadow: '0 0 6px var(--blue)' }}></span>
                            {t('hueforge_advanced')}
                        </button>
                    </div>

                    <window.HueForgeViewer
                        imageUrl={imageUrl}
                        layers={layers}
                        onGeometryReady={geo => { geoRef.current = geo; }}
                    />
                </div>

                {/* ════ RIGHT PANEL – Preset Filaments ════ */}
                <div className="panel-right">
                    <div className="panel-header">
                        <span className="panel-title">{t('hueforge_panel_right')}</span>
                    </div>
                    <div className="panel-body">

                        {/* Search */}
                        <div className="filament-search">
                            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder={t('hueforge_search')}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Brand Filter */}
                        <div className="brand-filter">
                            {brands.map(b => (
                                <button
                                    key={b}
                                    className={`brand-chip${brandFilter === b ? ' active' : ''}`}
                                    onClick={() => setBrandFilter(b)}
                                >
                                    {b}
                                </button>
                            ))}
                        </div>

                        {/* Filament List */}
                        <div className="filament-list" style={{ flex: 1 }}>
                            {filteredFilaments.map(fil => (
                                <div key={fil.id} className="filament-item">
                                    <div className="filament-swatch" style={{ background: fil.hex }} />
                                    <div className="filament-info">
                                        <div className="filament-name">{fil.colorName}</div>
                                        <div className="filament-sub">{fil.brand} · {fil.type}</div>
                                    </div>
                                    <div className="filament-td">TD {fil.td}</div>
                                    <button className="filament-add-btn" onClick={() => addLayer(fil)} title={t('hueforge_add_layer')}>+</button>
                                </div>
                            ))}
                            {filteredFilaments.length === 0 && (
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                                    No filaments found
                                </div>
                            )}
                        </div>

                        {/* TD Legend */}
                        <div className="section-label" style={{ marginTop: '0.5rem' }}>TD Scale Reference</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {[
                                { range: '0.8–1.5', label: 'Very opaque (Black, Dark)' },
                                { range: '1.5–3.0', label: 'Semi-opaque (Colors)' },
                                { range: '3.0–5.0', label: 'Translucent (Light colors)' },
                                { range: '5.0+', label: 'Highly translucent (White)' },
                            ].map(td => (
                                <div key={td.range} style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem' }}>
                                    <span style={{ fontFamily: 'var(--mono)', color: '#93C5FD' }}>{td.range}</span>
                                    <span>{td.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
