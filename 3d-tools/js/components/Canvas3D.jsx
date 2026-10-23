// =====================================================
// Canvas3D.jsx – Three.js canvas wrapper component
// Provides a shared 3D viewport with orbit controls
// implemented via vanilla Three.js (no R3F needed for CDN)
// =====================================================

window.Canvas3D = function Canvas3D({ onMount, className, children, info, hint, initialView }) {
    const canvasRef = React.useRef(null);
    const mountRef = React.useRef(null);
    const stateRef = React.useRef({ renderer: null, scene: null, camera: null, animId: null, theta: 0, phi: 70, radius: 120, targetTheta: 0, targetPhi: 70 });

    React.useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const W = mount.clientWidth || 600;
        const H = mount.clientHeight || 400;

        // Vista inicial (opcional)
        const iv = initialView || {};
        stateRef.current.theta = iv.theta ?? 0;
        stateRef.current.phi = iv.phi ?? 70;
        stateRef.current.radius = iv.radius ?? 120;
        stateRef.current.targetTheta = stateRef.current.theta;
        stateRef.current.targetPhi = stateRef.current.phi;

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
        // El estado vive en stateRef para que la API expuesta (reset/set)
        // pueda modificarlo desde fuera.
        let isDragging = false;
        let prevX = 0, prevY = 0;
        const st = stateRef.current;

        const updateCamera = () => {
            const t = THREE.MathUtils.degToRad(st.theta);
            const p = THREE.MathUtils.degToRad(Math.max(5, Math.min(175, st.phi)));
            camera.position.set(
                st.radius * Math.sin(p) * Math.sin(t),
                st.radius * Math.cos(p),
                st.radius * Math.sin(p) * Math.cos(t)
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
            st.targetTheta -= dx * 0.5;
            st.targetPhi -= dy * 0.5;
            prevX = cx; prevY = cy;
        };
        el.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
        el.addEventListener('touchmove', e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
        el.addEventListener('wheel', e => {
            st.radius = Math.max(10, Math.min(600, st.radius + e.deltaY * 0.2));
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

        // Animate (suavizado: theta/phi persiguen a targetTheta/targetPhi)
        const animate = () => {
            st.animId = requestAnimationFrame(animate);
            st.theta += (st.targetTheta - st.theta) * 0.08;
            st.phi += (st.targetPhi - st.phi) * 0.08;
            updateCamera();
            renderer.render(scene, camera);
        };
        animate();

        // Store refs (merge: conserva el estado de órbita ya inicializado)
        Object.assign(st, { renderer, scene, camera, ambientLight, dirLight });

        // API para el componente padre: reset/set de la vista de cámara
        const api = {
            scene, camera, renderer,
            reset: () => {
                st.targetTheta = iv.theta ?? 0;
                st.targetPhi = iv.phi ?? 70;
                st.radius = iv.radius ?? 120;
                st.theta = st.targetTheta; st.phi = st.targetPhi;
                updateCamera();
            },
            set: (t, p) => {
                st.targetTheta = t;
                st.targetPhi = p;
            },
            // Ajusta el radio de cámara para encuadrar un modelo de tamaño dado
            fit: (maxDim) => {
                st.radius = Math.max(10, Math.min(600, maxDim * 2.2));
                updateCamera();
            },
        };
        if (onMount) onMount(api);

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
