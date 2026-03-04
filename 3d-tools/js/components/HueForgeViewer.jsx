// =====================================================
// HueForgeViewer.jsx
// Three.js viewer for HueForge multi-layer preview.
// Renders a plane with vertex color blending based
// on TD values of each filament layer.
// =====================================================

window.HueForgeViewer = function HueForgeViewer({ imageUrl, layers }) {
    const { t } = ReactI18next.useTranslation();
    const sceneRef = React.useRef(null);
    const meshRef = React.useRef(null);
    const texRef = React.useRef(null);

    // Build shader material for TD-based blending
    const buildMaterial = React.useCallback((layers) => {
        if (!layers || layers.length === 0) {
            return new THREE.MeshStandardMaterial({ color: 0x1a2840, roughness: 0.8 });
        }

        // Simple approach: blend colors top-to-bottom based on layer heights
        // Real TD blending: higher TD = more translucent = underlying colors show through
        const sorted = [...layers].sort((a, b) => a.startMm - b.startMm);
        const topLayer = sorted[sorted.length - 1];

        const hexToRgb = hex => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return [r, g, b];
        };

        // Build uniforms for up to 8 layers
        const MAX_LAYERS = 8;
        const layerColors = [];
        const layerHeights = [];
        const layerTDs = [];

        for (let i = 0; i < MAX_LAYERS; i++) {
            const l = sorted[i];
            if (l) {
                layerColors.push(...hexToRgb(l.hex));
                layerHeights.push(l.startMm);
                layerTDs.push(l.td);
            } else {
                layerColors.push(0, 0, 0);
                layerHeights.push(999);
                layerTDs.push(1);
            }
        }

        const totalH = sorted.length > 0 ? sorted[sorted.length - 1].startMm + 2 : 5;

        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uLayerColors: { value: new Float32Array(layerColors) },
                uLayerHeights: { value: new Float32Array(layerHeights) },
                uLayerTDs: { value: new Float32Array(layerTDs) },
                uNumLayers: { value: sorted.length },
                uTotalH: { value: totalH },
                uTime: { value: 0 },
                uTex: { value: texRef.current },
                uHasTex: { value: texRef.current ? 1 : 0 },
            },
            vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        void main() {
          vUv = uv;
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform float uLayerColors[24];  // 8 layers * 3 channels
        uniform float uLayerHeights[8];
        uniform float uLayerTDs[8];
        uniform int   uNumLayers;
        uniform float uTotalH;
        uniform float uTime;
        uniform sampler2D uTex;
        uniform int   uHasTex;

        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          vec3 color = vec3(0.1, 0.15, 0.25);
          if (uNumLayers == 0) { gl_FragColor = vec4(color, 1.0); return; }

          // Map UV.y to height (0 = bottom layer, 1 = top)
          float h = vUv.y * uTotalH;

          // Find active layer
          int activeLayer = 0;
          for (int i = 0; i < 8; i++) {
            if (i >= uNumLayers) break;
            if (uLayerHeights[i] <= h) activeLayer = i;
          }

          int ci = activeLayer * 3;
          vec3 baseColor = vec3(uLayerColors[ci], uLayerColors[ci+1], uLayerColors[ci+2]);

          // TD-based translucency: blend underlying layer
          float td = uLayerTDs[activeLayer];
          float alpha = clamp(1.0 - td / 8.0, 0.2, 1.0);

          // Sample image texture if available
          if (uHasTex == 1) {
            vec4 texColor = texture2D(uTex, vUv);
            float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
            baseColor = mix(baseColor, baseColor * gray * 1.4, 0.5);
          }

          // Subtle edge shading
          float edge = smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x);
          baseColor *= mix(0.7, 1.0, edge);

          gl_FragColor = vec4(baseColor, 1.0);
        }
      `,
            side: THREE.DoubleSide,
        });
        return mat;
    }, []);

    // Load texture when imageUrl changes
    React.useEffect(() => {
        if (!imageUrl) { texRef.current = null; return; }
        const loader = new THREE.TextureLoader();
        loader.load(imageUrl, tex => {
            texRef.current = tex;
            if (meshRef.current && meshRef.current.material.uniforms) {
                meshRef.current.material.uniforms.uTex.value = tex;
                meshRef.current.material.uniforms.uHasTex.value = 1;
            }
        });
    }, [imageUrl]);

    // Rebuild mesh when layers change
    React.useEffect(() => {
        if (!sceneRef.current) return;
        const scene = sceneRef.current;

        if (meshRef.current) {
            scene.remove(meshRef.current);
            meshRef.current.geometry.dispose();
            meshRef.current.material.dispose();
            meshRef.current = null;
        }

        const geo = new THREE.PlaneGeometry(60, 60, 40, 40);
        const mat = buildMaterial(layers);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI * 0.1;
        scene.add(mesh);
        meshRef.current = mesh;
    }, [layers, buildMaterial]);

    const handleMount = React.useCallback(({ scene }) => {
        sceneRef.current = scene;
    }, []);

    const hint = t('litho_hint');

    return (
        <window.Canvas3D
            onMount={handleMount}
            hint={hint}
        >
            {(!layers || layers.length === 0) && !imageUrl && (
                <div className="canvas-empty">
                    <div className="empty-icon">🎨</div>
                    <span>Add filament layers and upload an image</span>
                </div>
            )}
        </window.Canvas3D>
    );
};
