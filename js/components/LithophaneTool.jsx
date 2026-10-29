// =====================================================
// LithophaneTool.jsx – Full Lithophane Generator UI
// =====================================================

window.LithophaneTool = function LithophaneTool({ onNavigate }) {
    const { t } = ReactI18next.useTranslation();

    // Image state
    const [imageUrl, setImageUrl] = React.useState(null);
    const [pixels, setPixels] = React.useState(null);
    const [imgW, setImgW] = React.useState(0);
    const [imgH, setImgH] = React.useState(0);

    // Controls
    const [brightness, setBrightness] = React.useState(0.65);
    const [contrast, setContrast] = React.useState(0.80);
    const [invert, setInvert] = React.useState(false);
    const [lightSource, setLightSource] = React.useState(false);
    const [baseThick, setBaseThick] = React.useState(0.8);
    const [maxThick, setMaxThick] = React.useState(3.2);
    const [resolution, setResolution] = React.useState(0.66);
    const [geomType, setGeomType] = React.useState('flat');

    // Geometry ref for export
    const geoRef = React.useRef(null);

    // Load image onto canvas to extract pixel data
    const loadImage = React.useCallback((file) => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setImageUrl(url);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, img.width, img.height);
            setPixels(data.data);
            setImgW(img.width);
            setImgH(img.height);
        };
        img.src = url;
    }, []);

    const handleDrop = e => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) loadImage(file);
    };

    const handleFileChange = e => {
        const file = e.target.files?.[0];
        if (file) loadImage(file);
    };

    const handleDownloadSTL = () => {
        if (!geoRef.current) return;
        try {
            const buffer = window.STLExporterUtil.exportToBinarySTL(geoRef.current);
            window.STLExporterUtil.download(buffer, '3dwork_lithophane.stl');
        } catch (err) {
            alert('STL export error: ' + err.message);
        }
    };

    const resLabel = resolution <= 0.33 ? t('litho_res_low') : resolution >= 0.77 ? t('litho_res_high') : '○';
    const gridW = resolution <= 0.33 ? 60 : resolution >= 0.77 ? 140 : 100;

    return (
        <div className="tool-page">
            {/* ============ THREE-COLUMN LAYOUT ============ */}
            <div className="tool-layout" style={{ height: '100%' }}>

                {/* ════ LEFT PANEL – Controls ════ */}
                <div className="panel-left">
                    <div className="panel-header">
                        <span className="panel-title">{t('litho_panel_title')}</span>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                        </svg>
                    </div>

                    <div className="panel-body">
                        {/* Image Upload */}
                        <label
                            className={`upload-zone${imageUrl ? ' has-image' : ''}`}
                            onDrop={handleDrop}
                            onDragOver={e => e.preventDefault()}
                        >
                            {imageUrl && <img src={imageUrl} alt="Source" />}
                            {!imageUrl && (
                                <>
                                    <span className="upload-icon">📷</span>
                                    <span className="upload-zone-text">{t('litho_upload')}</span>
                                </>
                            )}
                            <input type="file" accept="image/*" onChange={handleFileChange} />
                        </label>

                        {/* Brightness */}
                        <window.ControlSlider
                            label={t('litho_brightness')}
                            value={brightness} min={0} max={1} step={0.01}
                            onChange={setBrightness}
                        />

                        {/* Contrast */}
                        <window.ControlSlider
                            label={t('litho_contrast')}
                            value={contrast} min={0} max={1} step={0.01}
                            onChange={setContrast}
                        />

                        {/* Invert */}
                        <window.ToggleSwitch
                            label={t('litho_invert')}
                            checked={invert}
                            onChange={setInvert}
                        />

                        {/* Thickness */}
                        <div className="section-label">{t('litho_thickness_section')}</div>
                        <div className="thickness-grid">
                            <div className="thickness-item">
                                <label>{t('litho_base')}</label>
                                <span>{baseThick.toFixed(1)}mm</span>
                            </div>
                            <div className="thickness-item">
                                <label>{t('litho_max')}</label>
                                <span>{maxThick.toFixed(1)}mm</span>
                            </div>
                        </div>

                        <window.ControlSlider
                            label={t('litho_base')}
                            value={baseThick} min={0.4} max={2.0} step={0.1}
                            onChange={setBaseThick}
                            unit="mm"
                        />
                        <window.ControlSlider
                            label={t('litho_max')}
                            value={maxThick} min={1.5} max={6.0} step={0.1}
                            onChange={setMaxThick}
                            unit="mm"
                        />

                        {/* Resolution */}
                        <div className="control-group">
                            <div className="control-label">
                                <span>{t('litho_resolution')}</span>
                                <span className="control-value">{gridW}×{gridW}</span>
                            </div>
                            <input type="range" min={0} max={1} step={0.34} value={resolution} onChange={e => setResolution(parseFloat(e.target.value))} />
                        </div>

                        {/* Geometry */}
                        <div className="section-label">{t('litho_geometry')}</div>
                        <div className="geo-btn-group">
                            {['flat', 'cylindrical', 'curved'].map(g => (
                                <button
                                    key={g}
                                    className={`geo-btn${geomType === g ? ' active' : ''}`}
                                    onClick={() => setGeomType(g)}
                                >
                                    {t(`litho_${g}`)}
                                </button>
                            ))}
                        </div>

                        {/* Download */}
                        <button
                            className="download-btn"
                            onClick={handleDownloadSTL}
                            disabled={!pixels}
                        >
                            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            {t('litho_download')}
                        </button>
                    </div>
                </div>

                {/* ════ CENTER – 3D Preview ════ */}
                <div style={{ position: 'relative', background: '#080E1A' }}>
                    {/* Light source button */}
                    <button
                        className={`light-source-btn${lightSource ? ' active' : ''}`}
                        style={{ position: 'absolute', top: '0.75rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}
                        onClick={() => setLightSource(v => !v)}
                    >
                        <span className="dot"></span>
                        {t('litho_light')}
                    </button>

                    <window.LithophaneViewer
                        pixels={pixels} imgW={imgW} imgH={imgH}
                        brightness={brightness} contrast={contrast} invert={invert}
                        baseThick={baseThick} maxThick={maxThick} resolution={resolution}
                        geomType={geomType} lightSource={lightSource}
                        onGeometryReady={geo => { geoRef.current = geo; }}
                    />
                </div>

                {/* ════ RIGHT PANEL – Info / Stats ════ */}
                <div className="panel-right">
                    <div className="panel-header">
                        <span className="panel-title">{t('litho_preview')}</span>
                    </div>
                    <div className="panel-body">
                        <div className="section-label">Print Info</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {[
                                { label: 'Size', val: '80 × 80 mm' },
                                { label: t('litho_info_base'), val: `${baseThick.toFixed(1)} mm` },
                                { label: t('litho_info_max'), val: `${maxThick.toFixed(1)} mm` },
                                { label: t('litho_info_res'), val: `${gridW} × ${gridW}` },
                                { label: 'Geometry', val: geomType.charAt(0).toUpperCase() + geomType.slice(1) },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.label}</span>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--mono)' }}>{row.val}</span>
                                </div>
                            ))}
                        </div>

                        <div className="section-label" style={{ marginTop: '0.5rem' }}>Tips</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                            <p>• Use high-contrast B&W images for best results.</p>
                            <p>• Base thickness: 0.6–1.0mm recommended.</p>
                            <p>• Max thickness: 2.5–3.5mm for good light contrast.</p>
                            <p>• Print with 0% infill, 2–3 walls only.</p>
                            <p>• Use translucent PLA or PETG filament.</p>
                            <p>• Back-lighting reveals the depth effect.</p>
                        </div>

                        <div style={{ marginTop: 'auto' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(255,120,0,0.08), transparent)',
                                border: '1px solid rgba(255,120,0,0.2)',
                                borderRadius: 'var(--radius)',
                                padding: '0.75rem',
                                fontSize: '0.73rem',
                                color: 'var(--text-muted)',
                                lineHeight: 1.6,
                            }}>
                                <div style={{ fontWeight: 800, color: 'var(--accent-light)', marginBottom: '0.35rem' }}>🌐 3Dwork.io</div>
                                Export as watertight STL ready for any slicer. Enable light source to preview the backlit effect before printing.
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
