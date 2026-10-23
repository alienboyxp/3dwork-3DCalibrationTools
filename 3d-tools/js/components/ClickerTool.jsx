// =====================================================
// ClickerTool.jsx – Clicker Factory inspired tool
// Supports single and multi-clicker modes
// =====================================================

window.ClickerTool = function ClickerTool({ onNavigate }) {
    const { t } = ReactI18next.useTranslation();

    const [mode, setMode] = React.useState('single');  // 'single' | 'multi'

    // Single mode state
    const [imageUrl, setImageUrl] = React.useState(null);
    const [pixels, setPixels] = React.useState(null);
    const [imgW, setImgW] = React.useState(0);
    const [imgH, setImgH] = React.useState(0);

    // Text mode state
    const [inputMode, setInputMode] = React.useState('image'); // 'image' | 'text'
    const [textContent, setTextContent] = React.useState('');
    const [fontFamily, setFontFamily] = React.useState('Arial');
    const [fontSize, setFontSize] = React.useState(120);
    const [textBold, setTextBold] = React.useState(true);
    const [textItalic, setTextItalic] = React.useState(false);
    const [size, setSize] = React.useState('1u');
    const [carveDepth, setCarveDepth] = React.useState(1.2);
    const [brightness, setBrightness] = React.useState(0.5);
    const [contrast, setContrast] = React.useState(1.0);
    const [invert, setInvert] = React.useState(false);
    const [keychain, setKeychain] = React.useState(false);

    // Multi mode state
    const [clickers, setClickers] = React.useState([]);
    const [baseW, setBaseW] = React.useState(80);
    const [baseH, setBaseH] = React.useState(80);
    const [baseThick, setBaseThick] = React.useState(2.5);

    const geoRef = React.useRef(null);

    // Single mode image loading
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

    // Render text to image
    const renderText = React.useCallback(() => {
        if (!textContent.trim()) return;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        // Text
        const style = (textItalic ? 'italic ' : '') + (textBold ? 'bold ' : '') + fontSize + 'px ' + fontFamily;
        ctx.font = style;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Wrap text
        const words = textContent.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > size * 0.9 && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        const lineHeight = fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        const startY = (size - totalHeight) / 2 + lineHeight / 2;
        lines.forEach((line, i) => {
            ctx.fillText(line, size / 2, startY + i * lineHeight);
        });
        const url = canvas.toDataURL('image/png');
        setImageUrl(url);
        const data = ctx.getImageData(0, 0, size, size);
        setPixels(data.data);
        setImgW(size);
        setImgH(size);
    }, [textContent, fontFamily, fontSize, textBold, textItalic]);

    React.useEffect(() => {
        if (inputMode === 'text' && textContent.trim()) {
            renderText();
        }
    }, [inputMode, textContent, fontFamily, fontSize, textBold, textItalic]);

    // Multi mode: add a clicker
    const addClicker = () => {
        const newClicker = window.ClickerLayout.createClicker({ size: '1u' });
        const placed = window.ClickerLayout.autoPlace(newClicker, clickers, baseW, baseH);
        if (!placed) {
            // Try expanding base
            const [nw, nh] = window.ClickerLayout.suggestBaseSize([...clickers, newClicker]);
            setBaseW(nw);
            setBaseH(nh);
            window.ClickerLayout.autoPlace(newClicker, clickers, nw, nh);
        }
        setClickers(prev => [...prev, newClicker]);
    };

    // Multi mode: remove a clicker
    const removeClicker = (id) => {
        setClickers(prev => prev.filter(c => c.id !== id));
    };

    // Multi mode: load image for a specific clicker
    const loadClickerImage = (id, file) => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, img.width, img.height);
            setClickers(prev => prev.map(c => {
                if (c.id !== id) return c;
                return { ...c, pixels: data.data, imgW: img.width, imgH: img.height, imageUrl: url };
            }));
        };
        img.src = url;
    };

    const handleDownloadSTL = () => {
        if (!geoRef.current) return;
        try {
            const buffer = window.STLExporterUtil.exportToBinarySTL(geoRef.current);
            window.STLExporterUtil.download(buffer, mode === 'multi' ? '3dwork_clickers.stl' : '3dwork_clicker.stl');
        } catch (err) {
            alert('STL export error: ' + err.message);
        }
    };

    // Validation for multi mode
    const validation = mode === 'multi' ? window.ClickerLayout.validateLayout(clickers, baseW, baseH) : { valid: true, issues: [] };

    return (
        <div className="tool-page">
            <div className="tool-layout" style={{ height: '100%' }}>

                {/* LEFT PANEL – Controls */}
                <div className="panel-left">
                    <div className="panel-header">
                        <span className="panel-title">Clicker Factory</span>
                    </div>

                    <div className="panel-body">
                        {/* Mode toggle */}
                        <div className="section-label">Mode</div>
                        <div className="geo-btn-group">
                            <button className={`geo-btn${mode === 'single' ? ' active' : ''}`} onClick={() => setMode('single')}>Single</button>
                            <button className={`geo-btn${mode === 'multi' ? ' active' : ''}`} onClick={() => setMode('multi')}>Multi</button>
                        </div>

                        {mode === 'single' ? (
                            <>
                                {/* Input mode toggle */}
                                <div className="section-label">Input</div>
                                <div className="geo-btn-group">
                                    <button className={`geo-btn${inputMode === 'image' ? ' active' : ''}`} onClick={() => setInputMode('image')}>Image</button>
                                    <button className={`geo-btn${inputMode === 'text' ? ' active' : ''}`} onClick={() => setInputMode('text')}>Text</button>
                                </div>

                                {inputMode === 'image' ? (
                                    <label className={`upload-zone${imageUrl ? ' has-image' : ''}`} onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
                                        {imageUrl && <img src={imageUrl} alt="Source" />}
                                        {!imageUrl && (
                                            <>
                                                <span className="upload-icon">📷</span>
                                                <span className="upload-zone-text">Upload image</span>
                                            </>
                                        )}
                                        <input type="file" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <textarea
                                            value={textContent}
                                            onChange={e => setTextContent(e.target.value)}
                                            placeholder="Type your text..."
                                            style={{ width: '100%', minHeight: '60px', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text)', fontSize: '0.85rem', resize: 'vertical' }}
                                        />
                                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                                            <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} title="Font" style={{ flex: 1, fontSize: '0.75rem', background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.3rem' }}>
                                                <option value="Arial">Arial</option>
                                                <option value="Helvetica">Helvetica</option>
                                                <option value="Georgia">Georgia</option>
                                                <option value="Times New Roman">Times New Roman</option>
                                                <option value="Courier New">Courier New</option>
                                                <option value="Verdana">Verdana</option>
                                            </select>
                                            <input type="number" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value) || 120)} min={40} max={200} title="Font size" style={{ width: '60px', fontSize: '0.75rem', background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.3rem' }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <input type="checkbox" checked={textBold} onChange={e => setTextBold(e.target.checked)} /> Bold
                                            </label>
                                            <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <input type="checkbox" checked={textItalic} onChange={e => setTextItalic(e.target.checked)} /> Italic
                                            </label>
                                        </div>
                                        {imageUrl && <img src={imageUrl} alt="Text preview" style={{ width: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />}
                                    </div>
                                )}

                                {/* Size */}
                                <div className="section-label">Key Size</div>
                                <div className="geo-btn-group">
                                    {['1u', '2u', 'space'].map(s => (
                                        <button key={s} className={`geo-btn${size === s ? ' active' : ''}`} onClick={() => setSize(s)}>{s}</button>
                                    ))}
                                </div>

                                <window.ControlSlider label="Carve Depth" value={carveDepth} min={0.5} max={2.0} step={0.1} onChange={setCarveDepth} unit="mm" />
                                <window.ControlSlider label="Brightness" value={brightness} min={0} max={1} step={0.01} onChange={setBrightness} />
                                <window.ControlSlider label="Contrast" value={contrast} min={0.5} max={2.0} step={0.01} onChange={setContrast} />

                                <window.ToggleSwitch label="Invert" checked={invert} onChange={setInvert} />
                                <window.ToggleSwitch label="Keychain Loop" checked={keychain} onChange={setKeychain} />
                            </>
                        ) : (
                            <>
                                {/* Multi mode controls */}
                                <div className="section-label">Base Plate</div>
                                <window.ControlSlider label="Width" value={baseW} min={40} max={300} step={10} onChange={setBaseW} unit="mm" />
                                <window.ControlSlider label="Height" value={baseH} min={40} max={300} step={10} onChange={setBaseH} unit="mm" />
                                <window.ControlSlider label="Thickness" value={baseThick} min={2} max={5} step={0.5} onChange={setBaseThick} unit="mm" />

                                <button className="download-btn" onClick={addClicker} style={{ marginBottom: '0.5rem' }}>
                                    + Add Clicker
                                </button>

                                {!validation.valid && (
                                    <div style={{ color: '#ff6b6b', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                                        ⚠ {validation.issues.length} issue(s): {validation.issues.map(i => i.type).join(', ')}
                                    </div>
                                )}

                                <div className="section-label">Clickers ({clickers.length})</div>
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {clickers.map((c, idx) => (
                                        <div key={c.id} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', padding: '0.5rem', marginBottom: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>#{idx + 1} {c.size}</span>
                                                <button onClick={() => removeClicker(c.id)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.3rem' }}>
                                                <select value={c.size} onChange={e => setClickers(prev => prev.map(x => x.id === c.id ? { ...x, size: e.target.value } : x))} title="Key size" style={{ flex: 1, fontSize: '0.7rem', background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.25rem' }}>
                                                    <option value="1u">1u</option>
                                                    <option value="2u">2u</option>
                                                    <option value="space">space</option>
                                                </select>
                                                <input type="number" value={c.x} onChange={e => setClickers(prev => prev.map(x => x.id === c.id ? { ...x, x: parseFloat(e.target.value) || 0 } : x))} title="Position X (mm)" placeholder="X" style={{ width: '52px', fontSize: '0.7rem', background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.25rem' }} />
                                                <input type="number" value={c.y} onChange={e => setClickers(prev => prev.map(x => x.id === c.id ? { ...x, y: parseFloat(e.target.value) || 0 } : x))} title="Position Y (mm)" placeholder="Y" style={{ width: '52px', fontSize: '0.7rem', background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.25rem' }} />
                                                <select value={c.rotation} onChange={e => setClickers(prev => prev.map(x => x.id === c.id ? { ...x, rotation: parseInt(e.target.value) } : x))} title="Rotation" style={{ fontSize: '0.7rem', background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.25rem' }}>
                                                    <option value={0}>0°</option>
                                                    <option value={90}>90°</option>
                                                    <option value={180}>180°</option>
                                                    <option value={270}>270°</option>
                                                </select>
                                            </div>
                                            <label style={{ fontSize: '0.7rem', cursor: 'pointer' }}>
                                                📷 Image
                                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) loadClickerImage(c.id, f); }} />
                                            </label>
                                            {c.imageUrl && <img src={c.imageUrl} alt="" style={{ width: '30px', height: '30px', marginLeft: '0.3rem', verticalAlign: 'middle' }} />}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Download */}
                        <button className="download-btn" onClick={handleDownloadSTL} disabled={mode === 'single' ? !pixels : clickers.filter(c => c.pixels).length === 0}>
                            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Download STL
                        </button>
                    </div>
                </div>

                {/* CENTER – 3D Preview */}
                <div style={{ position: 'relative', background: '#080E1A' }}>
                    {mode === 'single' ? (
                        <window.ClickerViewer
                            pixels={pixels} imgW={imgW} imgH={imgH}
                            size={size} carveDepth={carveDepth}
                            brightness={brightness} contrast={contrast} invert={invert}
                            keychain={keychain}
                            onGeometryReady={geo => { geoRef.current = geo; }}
                        />
                    ) : (
                        <window.ClickerViewer
                            multi={true}
                            clickers={clickers}
                            baseW={baseW} baseH={baseH} baseThick={baseThick}
                            onGeometryReady={geo => { geoRef.current = geo; }}
                        />
                    )}
                </div>

                {/* RIGHT PANEL – Info */}
                <div className="panel-right">
                    <div className="panel-header">
                        <span className="panel-title">Info</span>
                    </div>
                    <div className="panel-body">
                        <div className="section-label">Print Tips</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                            <p>• Use MX-compatible switches (Cherry MX or clones).</p>
                            <p>• Print with 0.2mm layer height.</p>
                            <p>• Use 3-4 walls, 20% infill.</p>
                            <p>• PLA or PETG recommended.</p>
                            <p>• Multi: auto-place avoids collisions.</p>
                            <p>• Perimeter awareness prevents overlaps.</p>
                        </div>

                        <div style={{ marginTop: 'auto' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(158,119,237,0.08), transparent)',
                                border: '1px solid rgba(158,119,237,0.2)',
                                borderRadius: 'var(--radius)',
                                padding: '0.75rem',
                                fontSize: '0.73rem',
                                color: 'var(--text-muted)',
                                lineHeight: 1.6,
                            }}>
                                <div style={{ fontWeight: 800, color: 'var(--accent-light)', marginBottom: '0.35rem' }}>🌐 3Dwork.io</div>
                                {mode === 'multi' ? `Multi-clicker: ${clickers.length} clicker(s) on ${baseW}×${baseH}mm base.` : 'Single clicker mode.'}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
