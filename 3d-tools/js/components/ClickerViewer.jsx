// =====================================================
// ClickerViewer.jsx
// Manages the Three.js scene for clicker preview.
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
    const [processing, setProcessing] = React.useState(false);

    const gridW = 60, gridH = 60;

    React.useEffect(() => {
        if (!sceneRef.current) return;

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
                    if (!pixels) { setProcessing(false); return; }
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

                geo.computeBoundingBox();
                const box = geo.boundingBox;
                const center = new THREE.Vector3();
                box.getCenter(center);
                mesh.position.sub(center);
                mesh.position.y = 0;

                setProcessing(false);
                if (onGeometryReady) onGeometryReady(geo);
            } catch (err) {
                console.error('Clicker build error:', err);
                setProcessing(false);
            }
        }, 50);
        return () => clearTimeout(tid);
    }, [pixels, imgW, imgH, size, carveDepth, brightness, contrast, invert, keychain, multi, clickers, baseW, baseH, baseThick]);

    // Scene setup
    React.useEffect(() => {
        const container = sceneRef.current?.parentElement;
        if (!container) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x080E1A);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 30, 40);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambient);
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(10, 20, 10);
        scene.add(dir);

        const grid = new THREE.GridHelper(200, 40, 0x333333, 0x222222);
        scene.add(grid);

        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            container.removeChild(renderer.domElement);
            renderer.dispose();
        };
    }, []);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div ref={sceneRef} style={{ width: '100%', height: '100%' }} />
            {processing && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff' }}>
                    Processing...
                </div>
            )}
        </div>
    );
};
