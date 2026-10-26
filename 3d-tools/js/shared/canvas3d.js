        window.Canvas3DLocal = ({ onMount, hint, info, children, initialView }) => {
            const mount = useRef(null);
            const state = useRef(initialView || { theta: 45, phi: 65, radius: 200 });

            useEffect(() => {
                const r = new THREE.WebGLRenderer({ antialias: true }); r.setSize(mount.current.clientWidth, mount.current.clientHeight);
                r.localClippingEnabled = true;   // vista por capas de HueForge
                r.outputColorSpace = THREE.SRGBColorSpace; mount.current.appendChild(r.domElement);
                const s = new THREE.Scene(); s.background = new THREE.Color(0x080E1A);
                const c = new THREE.PerspectiveCamera(45, mount.current.clientWidth / mount.current.clientHeight, 1, 1000);
                // Luces a escala milimétrica: con la caída cuadrática por
                // defecto (decay 2) una luz a 150 mm queda a cero y el modelo
                // sale plano y oscuro. decay 0 = intensidad constante.
                s.add(new THREE.AmbientLight(0xffffff, 0.5));
                const pl = new THREE.PointLight(0xffffff, 1.05, 0, 0); pl.position.set(140, 160, 220); s.add(pl);
                const fill = new THREE.PointLight(0xC8DCFF, 0.4, 0, 0); fill.position.set(-200, -120, 140); s.add(fill);

                const update = () => {
                    const t = state.current.theta * (Math.PI / 180), p = Math.max(5, Math.min(175, state.current.phi)) * (Math.PI / 180);
                    c.position.set(state.current.radius * Math.sin(p) * Math.sin(t), state.current.radius * Math.cos(p), state.current.radius * Math.sin(p) * Math.cos(t));
                    c.lookAt(0, 0, 0);
                }; update();

                let drag = false, px, py;
                r.domElement.onmousedown = (e) => { drag = true; px = e.clientX; py = e.clientY; };
                window.onmouseup = () => drag = false;
                window.onmousemove = (e) => { if (drag) { state.current.theta -= (e.clientX - px) * 0.4; state.current.phi -= (e.clientY - py) * 0.4; px = e.clientX; py = e.clientY; update(); } };
                r.domElement.onwheel = (e) => { e.preventDefault(); state.current.radius = Math.max(40, Math.min(800, state.current.radius + e.deltaY * 0.4)); update(); };

                const anim = () => { state.current.id = requestAnimationFrame(anim); r.render(s, c); }; anim();
                if (onMount) onMount({ scene: s, reset: () => { state.current.theta = 45; state.current.phi = 65; state.current.radius = 200; update(); }, set: (t, p) => { state.current.theta = t; state.current.phi = p; update(); } });
                return () => { cancelAnimationFrame(state.current.id); r.dispose(); mount.current.removeChild(r.domElement); };
            }, []);

            return <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <div ref={mount} style={{ width: '100%', height: '100%' }} />
                {info && <div className="canvas-overlay" style={{ pointerEvents: 'none' }}><div className="canvas-info" dangerouslySetInnerHTML={{ __html: info }} /></div>}
                {hint && <div className="canvas-hint">{hint}</div>}
                {children}
            </div>;
        };

