// =====================================================
// lithoGeometry.js – Generador de mallas de litofanía
// =====================================================
//
// Por qué este módulo existe (y no dentro del JSX):
//   - Se puede probar en Node sin navegador (tests/lithoGeometry.test.js).
//   - La app inline de 3d-tools/index.html lo carga con un <script> normal.
//
// Mejoras frente a la versión anterior:
//   1. ORIENTACIÓN DE IMPRENTA: la litofanía se exporta DE PIE (imagen en el
//      plano XZ, grosor en Y). Impresa de pie, cada capa del slicer captura
//      una línea horizontal de la imagen; tumbada, cada capa es un corte
//      horizontal y el detalle se difumina. La versión anterior exportaba
//      tumbada siempre.
//   2. RESOLUCIÓN VERTICAL LIGADA A LA ALTURA DE CAPA: el detalle vertical de
//      una litofanía lo marca la altura de capa, no el nº de muestras. Ahora
//      las filas de la malla = altura / altura de capa (acotado).
//   3. ALTURAS CUANTIZADAS A LA ALTURA DE CAPA: la malla sólo usa espesores
//      que la impresora puede reproducir.
//   4. MARCO/BORDE sólido opcional alrededor de la imagen.
//   5. ÁNGULO DE CURVA regulable (60°-360°) para cilíndrica y curva.
//   6. Gamma, suavizado y espejo.
//   7. Muestreo con filtro de caja (promedio del área) → menos aliasing.
//   8. Malla estanca comprobable: el bobinado de todas las caras es
//      consistente (test de aristas dirigidas).
//
// Sin dependencias: devuelve arrays planos de posiciones que el llamante
// convierte en THREE.BufferGeometry.
// =====================================================

window.LithoGeometry = (function () {
    'use strict';

    const clamp = (v, a, b) => (v < a ? a : (v > b ? b : v));

    function luminance(pixels, idx) {
        return (pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114) / 255;
    }

    /**
     * Promedio de luminancia de un rectángulo de la imagen (filtro de caja).
     * Evita el aliasing de muestrear un solo píxel por celda.
     */
    function sampleBox(pixels, imgW, imgH, x0, y0, w, h) {
        const ix0 = clamp(Math.floor(x0), 0, imgW - 1);
        const iy0 = clamp(Math.floor(y0), 0, imgH - 1);
        const ix1 = clamp(Math.ceil(x0 + w), 1, imgW);
        const iy1 = clamp(Math.ceil(y0 + h), 1, imgH);
        let sum = 0, n = 0;
        for (let py = iy0; py < iy1; py++) {
            for (let px = ix0; px < ix1; px++) {
                sum += luminance(pixels, (py * imgW + px) * 4);
                n++;
            }
        }
        return n ? sum / n : 0;
    }

    /** Aplica la curva de tono: brillo, contraste y gamma. */
    function tone(g, o) {
        g = (g - 0.5) * o.contrast + 0.5 + (o.bright - 1);
        g = clamp(g, 0, 1);
        if (o.gamma && o.gamma !== 1) g = Math.pow(g, o.gamma);
        // La inversión se aplica una sola vez, al mapear a grosor.
        return g;
    }

    /**
     * Calcula el campo de alturas (mm) de la malla.
     * Devuelve { heights, xs, ys, nx, ny } donde:
     *   xs/ys  → coordenadas en mm de cada columna/fila (incluye el marco)
     *   heights→ altura (mm) de cada vértice, indexado [row * nx + col]
     */
    function buildHeightField(pixels, imgW, imgH, o) {
        const W = o.width, H = o.height;
        const border = o.border || 0;
        const borderCells = o.borderCells || 2;

        // ── 1. Rectángulo de la imagen dentro de la fuente ────────────────
        // 'fill' recorta lo que sobra (rellena el marco), 'fit' estira todo.
        const outR = W / H, inR = imgW / imgH;
        let sW = imgW, sH = imgH, oX = 0, oY = 0;
        if (o.scaleMode === 'fill') {
            if (inR > outR) { sW = imgH * outR; oX = (imgW - sW) / 2; }
            else { sH = imgW / outR; oY = (imgH - sH) / 2; }
        }

        // ── 2. Coordenadas de la malla (imagen + marco) ───────────────────
        const xs = [], ys = [];
        if (border > 0) {
            const bx = border / borderCells;
            for (let i = 0; i < borderCells; i++) xs.push(-W / 2 - border + i * bx);
            for (let i = 0; i < borderCells; i++) ys.push(-H / 2 - border + i * bx);
        }
        const imgX0 = xs.length;
        for (let c = 0; c <= o.res; c++) xs.push(-W / 2 + (c / o.res) * W);
        const imgY0 = ys.length;
        for (let r = 0; r <= o.resV; r++) ys.push(-H / 2 + (r / o.resV) * H);
        if (border > 0) {
            const bx = border / borderCells;
            // El borde derecho empieza en W/2 (vértice compartido con la
            // imagen) y necesita `borderCells` vértices más hasta W/2+borde.
            for (let i = 1; i <= borderCells; i++) xs.push(W / 2 + i * bx);
            for (let i = 1; i <= borderCells; i++) ys.push(H / 2 + i * bx);
        }
        const nx = xs.length, ny = ys.length;

        // ── 3. Alturas ────────────────────────────────────────────────────
        const heights = new Float32Array(nx * ny);
        const cellW = sW / o.res, cellH = sH / o.resV;
        for (let row = 0; row < ny; row++) {
            for (let col = 0; col < nx; col++) {
                const inFrame = border > 0 &&
                    (col < imgX0 || col >= imgX0 + o.res + 1 ||
                     row < imgY0 || row >= imgY0 + o.resV + 1);
                if (inFrame) {
                    heights[row * nx + col] = o.maxT;   // marco opaco
                    continue;
                }
                // Coordenada normalizada dentro de la imagen (0..1)
                const c = col - imgX0, r = row - imgY0;
                const u = c / o.res, v = r / o.resV;
                // Espejo horizontal: invierte el eje X de la muestreo.
                const sx = oX + (o.mirror ? (1 - u) : u) * sW, sy = oY + v * sH;
                let g = sampleBox(pixels, imgW, imgH, sx, sy, cellW, cellH);
                g = tone(g, o);
                // CONVENCIÓN DE LITOFANÍA: lo claro de la foto va FINO (deja
                // pasar la luz) y lo oscuro va GROSSO (la tapa). Mapear al
                // revés sale la imagen en negativo al retroiluminarla.
                // El interruptor "invert" mantiene el criterio contrario.
                const thick = o.invert ? g : (1 - g);
                heights[row * nx + col] = o.baseT + thick * (o.maxT - o.baseT);
            }
        }

        // ── 4. Suavizado ( desenfoque de caja 3×3 sobre la imagen ) ───────
        if (o.smoothing > 0) {
            const passes = clamp(Math.round(o.smoothing), 1, 4);
            const tmp = new Float32Array(heights.length);
            for (let p = 0; p < passes; p++) {
                for (let row = 0; row < ny; row++) {
                    for (let col = 0; col < nx; col++) {
                        let sum = 0, n = 0;
                        for (let dr = -1; dr <= 1; dr++) {
                            for (let dc = -1; dc <= 1; dc++) {
                                const rr = row + dr, cc = col + dc;
                                if (rr < 0 || rr >= ny || cc < 0 || cc >= nx) continue;
                                sum += heights[rr * nx + cc]; n++;
                            }
                        }
                        tmp[row * nx + col] = sum / n;
                    }
                }
                heights.set(tmp);
            }
        }

        // ── 5. Cuantización a la altura de capa ───────────────────────────
        // La malla sólo usa espesores que la impresora puede reproducir.
        if (o.layerHeight > 0) {
            const q = o.layerHeight;
            const qBase = Math.round(o.baseT / q) * q;   // suelo múltiplo de capa
            for (let i = 0; i < heights.length; i++) {
                let h = Math.round(heights[i] / q) * q;
                if (h < qBase - 1e-6) h = qBase;
                heights[i] = h;
            }
            o.effectiveBase = qBase;
        } else {
            o.effectiveBase = o.baseT;
        }

        return { heights, xs, ys, nx, ny, imgX0, imgY0 };
    }

    /**
     * Construye la malla de la litofanía.
     * @param {Uint8ClampedArray} pixels - RGBA
     * @param {number} imgW, imgH
     * @param {object} o - opciones (ver defaults abajo)
     * @returns {object} { positions: Float32Array, triangles: number, stats }
     */
    function build(pixels, imgW, imgH, o) {
        const opt = Object.assign({
            width: 100, height: 100,
            baseT: 0.8, maxT: 3.0,
            bright: 0.8, contrast: 1.0, invert: false,
            gamma: 1, smoothing: 0, mirror: false,
            res: 120, resV: 0,          // resV=0 → se calcula con la altura de capa
            layerHeight: 0.12,
            maxCells: 260000,
            geom: 'flat',               // flat | cylindrical | curved
            curveAngle: 180,           // grados
            border: 0,
            borderCells: 2,
            scaleMode: 'fill',
            upright: true               // imprimir de pie
        }, o || {});

        // ── Resolución vertical ligada a la altura de capa ────────────────
        // En vertical, cada fila de la malla es una capa impresa: no tiene
        // sentido muestrear más filas que capas.
        if (!opt.resV || opt.resV <= 0) {
            const lh = opt.layerHeight > 0 ? opt.layerHeight : 0.12;
            opt.resV = clamp(Math.round(opt.height / lh), 32, 1200);
        }
        // Acota el peso total (celdas) para que el STL siga siendo manejable
        if (opt.res * opt.resV > opt.maxCells) {
            const k = Math.sqrt(opt.maxCells / (opt.res * opt.resV));
            opt.res = Math.max(40, Math.round(opt.res * k));
            opt.resV = Math.max(32, Math.round(opt.resV * k));
        }

        const field = buildHeightField(pixels, imgW, imgH, opt);
        let { heights, xs, ys, nx, ny } = field;

        // ── Posición de un vértice ────────────────────────────────────────
        // Espacio canónico: u = eje del ancho, v = eje del alto (imagen),
        // w = grosor. La posición final depende de la orientación de impresa.
        const W = opt.width, H = opt.height;
        const halfAngle = (opt.curveAngle * Math.PI) / 360; // media apertura
        const angleTotal = halfAngle * 2;
        const arc = opt.geom !== 'flat';
        // Radio: el arco developmentado debe medir el ancho de la imagen.
        const R = arc ? W / Math.max(0.08, angleTotal) : 0;
        // Con 360° el cilindro cierra: la última columna coincide con la
        // primera, así que se copia su altura (costura) y no se pone pared.
        const seamless = arc && angleTotal >= Math.PI * 2 - 1e-6;
        if (seamless) {
            for (let row = 0; row < ny; row++) {
                heights[row * nx + nx - 1] = heights[row * nx];
            }
        }

        function pos(col, row, w) {
            const u = xs[col], v = ys[row];
            if (arc) {
                // u va de -W/2 a +W/2 → hay que recentrar antes de proyectar
                const a = ((u + W / 2) / W) * angleTotal - halfAngle;
                const r = R + w;
                const xa = Math.sin(a) * r, za = Math.cos(a) * r - R;
                // De pie el eje del cilindro queda vertical (Z).
                return opt.upright ? [xa, za, v] : [xa, v, za];
            }
            // De pie: imagen en el plano XZ, grosor en Y.
            return opt.upright ? [u, -w, v] : [u, v, w];
        }

        const positions = [];
        // El mapeo "de pie + cilíndrica" invierte la orientación (es una
        // transposición): hay que invertir el bobinado de las caras.
        const flip = arc && opt.upright;
        const tri = (a, b, c) => {
            if (flip) {
                positions.push(
                    a[0], a[1], a[2],
                    c[0], c[1], c[2],
                    b[0], b[1], b[2]
                );
            } else {
                positions.push(
                    a[0], a[1], a[2],
                    b[0], b[1], b[2],
                    c[0], c[1], c[2]
                );
            }
        };

        const h = (col, row) => heights[row * nx + col];

        // ── Caras ─────────────────────────────────────────────────────────
        // Canonical: u = ancho, v = alto, w = grosor. Cara frontal = w = h (normal +w).
        for (let row = 0; row < ny - 1; row++) {
            for (let col = 0; col < nx - 1; col++) {
                const h00 = h(col, row), h10 = h(col + 1, row);
                const h01 = h(col, row + 1), h11 = h(col + 1, row + 1);
                // Frontal (normal +w)
                tri(pos(col, row, h00), pos(col + 1, row, h10), pos(col + 1, row + 1, h11));
                tri(pos(col, row, h00), pos(col + 1, row + 1, h11), pos(col, row + 1, h01));
                // Trasera (normal -w)
                tri(pos(col, row, 0), pos(col + 1, row + 1, 0), pos(col + 1, row, 0));
                tri(pos(col, row, 0), pos(col, row + 1, 0), pos(col + 1, row + 1, 0));
            }
        }
        // Paredes: mismo bobinado que las caras para que la malla quede
        // estanca (cada arista dirigida aparece exactamente una vez).
        // Pared inferior (row = 0), normal -v
        for (let col = 0; col < nx - 1; col++) {
            tri(pos(col, 0, 0), pos(col + 1, 0, 0), pos(col + 1, 0, h(col + 1, 0)));
            tri(pos(col, 0, 0), pos(col + 1, 0, h(col + 1, 0)), pos(col, 0, h(col, 0)));
        }
        // Pared superior (row = ny-1), normal +v
        for (let col = 0; col < nx - 1; col++) {
            tri(pos(col + 1, ny - 1, 0), pos(col, ny - 1, 0), pos(col, ny - 1, h(col, ny - 1)));
            tri(pos(col + 1, ny - 1, 0), pos(col, ny - 1, h(col, ny - 1)), pos(col + 1, ny - 1, h(col + 1, ny - 1)));
        }
        // Paredes laterales (col = 0 y col = nx-1).
        // Con 360° las dos columnas coinciden: la cara frontal y la trasera
        // ya se unen entre sí en la costura, así que no hay que poner pared
        // (si se pusiera, quedarían aristas duplicadas).
        if (!seamless) {
            // Pared izquierda (col = 0), normal -u
            for (let row = 0; row < ny - 1; row++) {
                tri(pos(0, row + 1, 0), pos(0, row, 0), pos(0, row, h(0, row)));
                tri(pos(0, row + 1, 0), pos(0, row, h(0, row)), pos(0, row + 1, h(0, row + 1)));
            }
            // Pared derecha (col = nx-1), normal +u
            for (let row = 0; row < ny - 1; row++) {
                tri(pos(nx - 1, row, 0), pos(nx - 1, row + 1, 0), pos(nx - 1, row + 1, h(nx - 1, row + 1)));
                tri(pos(nx - 1, row, 0), pos(nx - 1, row + 1, h(nx - 1, row + 1)), pos(nx - 1, row, h(nx - 1, row)));
            }
        }

        // ── Asentar sobre la cama ────────────────────────────────────────
        // pos() ya devuelve la posición final; sólo hay que dejar el mínimo
        // en z = 0 para que la pieza apoye en la cama.
        let minZ = Infinity, maxZ = -Infinity, minY = Infinity, maxY = -Infinity;
        const out = new Float32Array(positions.length);
        const levels = new Float32Array(positions.length / 3);
        // Nivel de grosor de un vértice (0 = translúcido, 1 = opaco).
        // Sirve para pintar el preview por simulación de luz.
        function levelAt(x, y, z) {
            if (!arc) return opt.upright ? (-y) / opt.maxT : z / opt.maxT;
            const r = opt.upright
                ? Math.sqrt(x * x + y * y)
                : Math.sqrt(x * x + z * z);
            return (r - R) / opt.maxT;
        }
        for (let i = 0, v = 0; i < positions.length; i += 3, v++) {
            out[i] = positions[i];
            out[i + 1] = positions[i + 1];
            out[i + 2] = positions[i + 2];
            levels[v] = clamp(levelAt(out[i], out[i + 1], out[i + 2]), 0, 1);
            if (out[i + 2] < minZ) minZ = out[i + 2];
            if (out[i + 2] > maxZ) maxZ = out[i + 2];
            if (out[i + 1] < minY) minY = out[i + 1];
            if (out[i + 1] > maxY) maxY = out[i + 1];
        }
        const dz = -minZ;
        for (let i = 2; i < out.length; i += 3) out[i] += dz;

        const triangles = out.length / 9;
        const stats = {
            triangles: triangles,
            vertices: out.length / 3,
            fileSize: 84 + triangles * 50,
            widthMM: Math.round((opt.width + 2 * (opt.border || 0)) * 100) / 100,
            heightMM: Math.round((opt.height + 2 * (opt.border || 0)) * 100) / 100,
            depthMM: Math.round((maxY - minY) * 100) / 100,
            resX: opt.res,
            resY: opt.resV,
            steps: opt.layerHeight > 0
                ? Math.max(1, Math.round((opt.maxT - opt.effectiveBase) / opt.layerHeight) + 1)
                : null,
            effectiveBase: opt.effectiveBase,
            cells: (nx - 1) * (ny - 1)
        };
        return { positions: out, levels: levels, stats: stats, grid: { nx: nx, ny: ny } };
    }

    /**
     * Comprueba que la malla es estanca: cada arista dirigida debe aparecer
     * exactamente una vez (superficie cerrada y orientada de forma uniforme).
     * @param {Float32Array} positions
     * @returns {{closed:boolean, open:number, flipped:number, nonManifold:number}}
     */
    function checkWatertight(positions) {
        const edges = new Map();
        const key = (x, y, z) =>
            Math.round(x * 1000) + '|' + Math.round(y * 1000) + '|' + Math.round(z * 1000);
        const triCount = positions.length / 9;
        for (let t = 0; t < triCount; t++) {
            const i = t * 9;
            const p = [
                [positions[i], positions[i + 1], positions[i + 2]],
                [positions[i + 3], positions[i + 4], positions[i + 5]],
                [positions[i + 6], positions[i + 7], positions[i + 8]]
            ];
            for (let e = 0; e < 3; e++) {
                const a = key(p[e][0], p[e][1], p[e][2]);
                const b = key(p[(e + 1) % 3][0], p[(e + 1) % 3][1], p[(e + 1) % 3][2]);
                const k = a + '>' + b;
                edges.set(k, (edges.get(k) || 0) + 1);
            }
        }
        let open = 0, flipped = 0, nonManifold = 0;
        edges.forEach((count, k) => {
            const [a, b] = k.split('>');
            const rev = edges.get(b + '>' + a) || 0;
            if (count > 1) nonManifold++;
            else if (rev === 0) open++;      // arista sin pareja → hole
            else if (rev > 1) flipped++;     // más de una pareja → orientación rareada
        });
        return {
            closed: open === 0 && flipped === 0 && nonManifold === 0,
            open: open, flipped: flipped, nonManifold: nonManifold
        };
    }

    return { build: build, checkWatertight: checkWatertight, sampleBox: sampleBox };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.LithoGeometry;
}
