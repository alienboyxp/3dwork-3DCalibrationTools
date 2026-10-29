// =====================================================
// ClickerViewer.jsx
// Manages the Three.js scene for clicker preview.
// Uses the shared Canvas3D wrapper (orbit controls, zoom,
// resize observer) like the lithophane/HueForge tools.
// Supports single and multi-clicker modes.
// =====================================================

window.ClickerViewer = function ClickerViewer({
    // Single mode
    pixels, imgW, imgH,
    size, carveDepth, brightness, contrast, invert, keychain,
    // Multi mode
    multi, clickers, baseW, baseH, baseThick,
    onGeometryReady
}) {
    const sceneRef = React.useRef(null);
    const meshRef = React.useRef(null);
    const apiRef = React.useRef(null);
    const [processing, setProcessing] = React.useState(false);

    const gridW = 60, gridH = 60;

    React.useEffect(() => {
        if (!sceneRef.current) return;
        if (!multi && !pixels) return;

        setProcessing(true);
        const tid = setTimeout(() => {
            try {
                const scene = sceneRef.current;
                if (meshRef.current) {
                    scene.remove(meshRef.current);
                    meshRef.current.geometry.dispose();
                    meshRef.current.material.dispose();
                    meshRef.current = null;
                }

                let geo;
                if (multi) {
                    const result = window.ClickerGeometry.buildMultiClicker(
                        (clickers || []).map(c => ({
                            ...c,
                            carveDepth: c.carveDepth || 1.2,
                            brightness: c.brightness || 0.5,
                            contrast: c.contrast || 1.0,
                            invert: c.invert || false,
                            keychain: c.keychain || false
                        })),
                        baseW || 80, baseH || 80, baseThick || 2.5
                    );
                    geo = new THREE.BufferGeometry();
                    geo.setAttribute('position', new THREE.BufferAttribute(result.positions, 3));
                    geo.computeVertexNormals();
                } else {
                    const result = window.ClickerGeometry.buildClicker(
                        pixels, imgW, imgH,
                        { size: size || '1u', carveDepth: carveDepth || 1.2, brightness: brightness || 0.5, contrast: contrast || 1.0, invert: invert || false, gridW, gridH, keychain: keychain || false }
                    );
                    geo = new THREE.BufferGeometry();
                    geo.setAttribute('position', new THREE.BufferAttribute(result.positions, 3));
                    if (result.indices) geo.setIndex(new THREE.BufferAttribute(result.indices, 1));
                    geo.computeVertexNormals();
                }

                const mat = new THREE.MeshStandardMaterial({
                    color: 0xE8E0D5,
                    roughness: 0.55,
                    metalness: 0.05,
                    side: THREE.FrontSide,
                });
                const mesh = new THREE.Mesh(geo, mat);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                scene.add(mesh);
                meshRef.current = mesh;

                // Centrar el modelo en el origen (la cámara orbita alrededor de 0,0,0)
                geo.computeBoundingBox();
                const box = geo.boundingBox;
                const center = new THREE.Vector3();
                box.getCenter(center);
                mesh.position.sub(center);

                // Auto-encuadre: el radio de cámara sigue el tamaño del modelo
                const size = new THREE.Vector3();
                box.getSize(size);
                if (apiRef.current && apiRef.current.fit) {
                    apiRef.current.fit(Math.max(size.x, size.y, size.z));
                }

                setProcessing(false);
                if (onGeometryReady) onGeometryReady(geo);
            } catch (err) {
                console.error('Clicker build error:', err);
                setProcessing(false);
            }
        }, 50);
        return () => clearTimeout(tid);
    }, [pixels, imgW, imgH, size, carveDepth, brightness, contrast, invert, keychain, multi, clickers, baseW, baseH, baseThick]);

    const info = multi
        ? `Plate: ${baseW || 80} × ${baseH || 80} mm — ${(clickers || []).length} clicker(s)`
        : (pixels ? `Key: ${size || '1u'} — carved ${(carveDepth || 1.2).toFixed(1)} mm` : 'Waiting for image or text…');

    return (
        <window.Canvas3D
            onMount={o => { sceneRef.current = o.scene; apiRef.current = o; }}
            initialView={{ theta: 30, phi: 65, radius: 90 }}
            hint="Drag to rotate • Scroll to zoom"
            info={info}
        >
            {processing && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(15,23,42,0.85)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 10, color: '#94A3B8' }}>
                    Building…
                </div>
            )}
            <div className="view-btns">
                <button className="v-btn" onClick={() => apiRef.current && apiRef.current.reset()}>Reset</button>
                <button className="v-btn" onClick={() => apiRef.current && apiRef.current.set(0, 10)}>Top</button>
                <button className="v-btn" onClick={() => apiRef.current && apiRef.current.set(0, 85)}>Front</button>
            </div>
        </window.Canvas3D>
    );
};
