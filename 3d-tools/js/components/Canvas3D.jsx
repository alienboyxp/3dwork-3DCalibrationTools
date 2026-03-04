// =====================================================
// Canvas3D.jsx – Three.js canvas wrapper component
// Provides a shared 3D viewport with orbit controls
// implemented via vanilla Three.js (no R3F needed for CDN)
// =====================================================

window.Canvas3D = function Canvas3D({ onMount, className, children, info, hint }) {
    const canvasRef = React.useRef(null);
    const mountRef = React.useRef(null);
    const stateRef = React.useRef({ renderer: null, scene: null, camera: null, animId: null });

    React.useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const W = mount.clientWidth || 600;
        const H = mount.clientHeight || 400;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(W, H);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        mount.appendChild(renderer.domElement);
        renderer.domElement.className = 'canvas-3d';

        // Scene & Camera
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x080E1A);
        scene.fog = new THREE.FogExp2(0x080E1A, 0.008);

        const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
        camera.position.set(0, 0, 120);
        camera.lookAt(0, 0, 0);

        // Grid helper
        const grid = new THREE.GridHelper(200, 30, 0x1a2840, 0x111d2e);
        grid.position.y = -45;
        grid.rotation.y = 0;
        scene.add(grid);

        // Ambient + directional lights (default)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(50, 80, 60);
        dirLight.castShadow = true;
        scene.add(dirLight);

        // --- Orbit Controls (manual implementation) ---
        let isDragging = false;
        let prevX = 0, prevY = 0;
        let theta = 0, phi = 70;
        let radius = 120;
        let targetTheta = 0, targetPhi = 70;

        const updateCamera = () => {
            const t = THREE.MathUtils.degToRad(targetTheta);
            const p = THREE.MathUtils.degToRad(Math.max(5, Math.min(175, targetPhi)));
            camera.position.set(
                radius * Math.sin(p) * Math.sin(t),
                radius * Math.cos(p),
                radius * Math.sin(p) * Math.cos(t)
            );
            camera.lookAt(0, 0, 0);
        };
        updateCamera();

        const el = renderer.domElement;
        el.addEventListener('mousedown', e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; });
        el.addEventListener('touchstart', e => { isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; });
        window.addEventListener('mouseup', () => isDragging = false);
        window.addEventListener('touchend', () => isDragging = false);

        const onMove = (cx, cy) => {
            if (!isDragging) return;
            const dx = cx - prevX, dy = cy - prevY;
            targetTheta -= dx * 0.5;
            targetPhi -= dy * 0.5;
            prevX = cx; prevY = cy;
        };
        el.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
        el.addEventListener('touchmove', e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
        el.addEventListener('wheel', e => {
            radius = Math.max(30, Math.min(300, radius + e.deltaY * 0.2));
        });

        // Axes helper
        const axesHelper = new THREE.AxesHelper(20);
        axesHelper.position.set(-90, -35, 0);
        scene.add(axesHelper);

        // Resize observer
        const ro = new ResizeObserver(() => {
            const w = mount.clientWidth, h = mount.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });
        ro.observe(mount);

        // Animate
        const animate = () => {
            stateRef.current.animId = requestAnimationFrame(animate);
            theta += (targetTheta - theta) * 0.08;
            phi += (targetPhi - phi) * 0.08;
            updateCamera();
            renderer.render(scene, camera);
        };
        animate();

        // Store refs
        stateRef.current = { renderer, scene, camera, animId: stateRef.current.animId, ambientLight, dirLight };

        // Expose to parent
        if (onMount) onMount({ scene, camera, renderer });

        return () => {
            cancelAnimationFrame(stateRef.current.animId);
            ro.disconnect();
            renderer.dispose();
            if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
        };
    }, []);

    return (
        <div className={`canvas-center ${className || ''}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

            {/* Info overlay */}
            {info && (
                <div className="canvas-overlay" style={{ pointerEvents: 'none' }}>
                    <div className="canvas-info" dangerouslySetInnerHTML={{ __html: info }} />
                </div>
            )}

            {/* Hint bar */}
            {hint && <div className="canvas-hint">{hint}</div>}

            {children}
        </div>
    );
};
