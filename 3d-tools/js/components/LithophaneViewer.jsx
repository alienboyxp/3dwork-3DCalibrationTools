// =====================================================
// LithophaneViewer.jsx
// Manages the Three.js scene for lithophane preview.
// Receives image pixel data + settings and rebuilds
// the mesh whenever parameters change.
// =====================================================

window.LithophaneViewer = function LithophaneViewer({
    pixels, imgW, imgH,
    brightness, contrast, invert,
    baseThick, maxThick, resolution,
    geomType, lightSource,
    onGeometryReady
}) {
    const { t } = ReactI18next.useTranslation();
    const sceneRef = React.useRef(null);
    const meshRef = React.useRef(null);
    const lightRef = React.useRef(null);
    const [processing, setProcessing] = React.useState(false);
    const [progress, setProgress] = React.useState(0);

    const gridSize = React.useMemo(() => {
        const r = parseFloat(resolution);
        if (r <= 0.33) return { w: 60, h: 60 };
        if (r <= 0.66) return { w: 100, h: 100 };
        return { w: 140, h: 140 };
    }, [resolution]);

    // Rebuild mesh when params change
    React.useEffect(() => {
        if (!pixels || !sceneRef.current) return;

        setProcessing(true);
        setProgress(0);

        // Use requestIdleCallback to avoid blocking UI
        const tid = setTimeout(() => {
            try {
                const geo = window.STLExporterUtil.buildLithophaneGeometry(
                    pixels, imgW, imgH,
                    {
                        gridW: gridSize.w,
                        gridH: gridSize.h,
                        baseThick, maxThick,
                        brightness, contrast, invert,
                        geomType
                    }
                );

                const scene = sceneRef.current;
                if (meshRef.current) {
                    scene.remove(meshRef.current);
                    meshRef.current.geometry.dispose();
                    meshRef.current.material.dispose();
                    meshRef.current = null;
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

                geo.computeBoundingBox();
                const box = geo.boundingBox;
                const center = new THREE.Vector3();
                box.getCenter(center);
                mesh.position.sub(center);
                mesh.position.y = 0;

                setProgress(100);
                setTimeout(() => { setProcessing(false); }, 200);
                if (onGeometryReady) onGeometryReady(geo);
            } catch (err) {
                console.error('Lithophane mesh error:', err);
                setProcessing(false);
            }
        }, 50);

        return () => clearTimeout(tid);
    }, [pixels, imgW, imgH, brightness, contrast, invert, baseThick, maxThick, gridSize, geomType]);

    // Light source toggle
    React.useEffect(() => {
        if (!sceneRef.current || !meshRef.current) return;
        const scene = sceneRef.current;

        if (lightRef.current) {
            scene.remove(lightRef.current);
            lightRef.current = null;
        }

        if (lightSource) {
            const backLight = new THREE.PointLight(0xFFF5E0, 3.5, 200);
            backLight.position.set(0, 0, -25);
            scene.add(backLight);
            lightRef.current = backLight;

            if (meshRef.current) {
                meshRef.current.material.color.set(0xFFEFC0);
                meshRef.current.material.emissive = new THREE.Color(0x120800);
                meshRef.current.material.emissiveIntensity = 0.15;
                meshRef.current.material.roughness = 0.3;
            }
        } else {
            if (meshRef.current) {
                meshRef.current.material.color.set(0xE8E0D5);
                meshRef.current.material.emissive = new THREE.Color(0x000000);
                meshRef.current.material.roughness = 0.55;
            }
        }
    }, [lightSource]);

    const handleMount = React.useCallback(({ scene }) => {
        sceneRef.current = scene;
    }, []);

    const infoHTML = pixels
        ? `${t('litho_info_thick')}: Base ${baseThick.toFixed(1)}mm / Max ${maxThick.toFixed(1)}mm<br/>${t('litho_info_res')}: ${gridSize.w}×${gridSize.h}`
        : '';

    return (
        <window.Canvas3D
            onMount={handleMount}
            hint={pixels ? t('litho_hint') : null}
            info={infoHTML}
        >
            {!pixels && (
                <div className="canvas-empty">
                    <div className="empty-icon">🖼️</div>
                    <span>{t('litho_no_image')}</span>
                </div>
            )}
            {processing && (
                <div className="canvas-processing">
                    <div className="pulse" style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 700 }}>
                        {t('litho_processing')}
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}
        </window.Canvas3D>
    );
};
