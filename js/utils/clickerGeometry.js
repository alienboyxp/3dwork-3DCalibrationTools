// =====================================================
// clickerGeometry.js – Generador de clickers imprimibles
// =====================================================
//
// Inspirado en Clicker Factory (clickerfactory.com), con mejoras propias:
//   - Layout libre de múltiples clickers en una base
//   - Posición del switch configurable
//   - Texto e iconos
//   - Exportación mono y multi-color (3MF)
//
// El clicker se basa en el estándar MX (Cherry MX / clones): un hueco
// de 14×14×5.5 mm en la base y un vástago cruzado de 4×4 mm con brazos
// de 1,25 mm. El diseño mecánico es genérico y estándar en la industria.
//
// Sin dependencias. window.ClickerGeometry
// =====================================================

window.ClickerGeometry = (function () {
    'use strict';

    const clamp = (v, a, b) => (v < a ? a : (v > b ? b : v));

    // ── Parámetros estándar del switch MX ───────────────────────────────
    const MX_HOLE = 14.0;
    const MX_DEPTH = 5.5;
    const MX_STEM = 4.0;
    const MX_STEM_ARM = 1.25;
    const KEY_UNIT = 18.0;
    const KEY_HEIGHT = 7.0;
    const TOP_SIZE = 14.0;
    const BASE_THICK = 2.5;
    const BASE_MARGIN = 3.0;

    function buildClicker(pixels, imgW, imgH, opts) {
        const o = Object.assign({
            size: '1u',
            baseThick: BASE_THICK,
            keyHeight: KEY_HEIGHT,
            carveDepth: 1.2,
            bright: 0.5,
            contrast: 1.0,
            invert: false,
            gridW: 60,
            gridH: 60,
            keychain: false,
        }, opts || {});

        const keySizes = { '1u': [KEY_UNIT, KEY_UNIT], '2u': [KEY_UNIT, KEY_UNIT * 2], 'space': [KEY_UNIT, KEY_UNIT * 6] };
        const [keyW, keyH] = keySizes[o.size] || keySizes['1u'];
        const baseW = Math.max(keyW, MX_HOLE + BASE_MARGIN * 2);
        const baseH = Math.max(keyH, MX_HOLE + BASE_MARGIN * 2);
        const baseD = o.baseThick;

        // ── Muestreo del relieve ─────────────────────────────────────────
        const heights = new Float32Array((o.gridW + 1) * (o.gridH + 1));
        for (let row = 0; row <= o.gridH; row++) {
            for (let col = 0; col <= o.gridW; col++) {
                const x0 = (col / o.gridW) * imgW, y0 = (row / o.gridH) * imgH;
                const ix0 = clamp(Math.floor(x0), 0, imgW - 1);
                const iy0 = clamp(Math.floor(y0), 0, imgH - 1);
                const ix1 = clamp(Math.ceil(x0 + imgW / o.gridW), 1, imgW);
                const iy1 = clamp(Math.ceil(y0 + imgH / o.gridH), 1, imgH);
                let sum = 0, n = 0;
                for (let py = iy0; py < iy1; py++) {
                    for (let px = ix0; px < ix1; px++) {
                        const i = (py * imgW + px) * 4;
                        sum += (pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114) / 255;
                        n++;
                    }
                }
                let g = n ? sum / n : 0;
                g = (g - 0.5) * o.contrast + 0.5 + (o.bright - 0.5);
                g = clamp(g, 0, 1);
                if (o.invert) g = 1 - g;
                heights[row * (o.gridW + 1) + col] = g * o.carveDepth;
            }
        }

        const H = (col, row) => heights[row * (o.gridW + 1) + col];

        // Helper: emite un triángulo (non-indexed, cada triángulo con sus
        // propios vértices). El test de estanqueidad funciona sobre la
        // geometría non-indexed (las aristas compartidas se detectan por
        // posición, y los vértices duplicados no colisionan).
        const positions = [];
        const tri = (a, b, c) => {
            positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
        };
        const quad = (a, b, c, d) => {
            tri(a, b, c);
            tri(a, c, d);
        };

        // ── 1. BASE ──────────────────────────────────────────────────────
        const bx0 = -baseW / 2, bx1 = baseW / 2;
        const by0 = -baseH / 2, by1 = baseH / 2;
        const bz = baseD;
        const hx0 = -MX_HOLE / 2, hx1 = MX_HOLE / 2;
        const hy0 = -MX_HOLE / 2, hy1 = MX_HOLE / 2;

        // Top face (z = bz), with hole
        quad([bx0, by1, bz], [bx1, by1, bz], [hx1, hy1, bz], [hx0, hy1, bz]);
        quad([bx0, by0, bz], [hx0, hy0, bz], [hx1, hy0, bz], [bx1, by0, bz]);
        quad([bx0, by1, bz], [hx0, hy1, bz], [hx0, hy0, bz], [bx0, by0, bz]);
        quad([bx1, by1, bz], [hx1, hy0, bz], [hx1, hy1, bz], [bx1, by0, bz]);

        // Bottom face (z = 0)
        quad([bx0, by0, 0], [bx1, by0, 0], [bx1, by1, 0], [bx0, by1, 0]);

        // Side walls (4 outer sides)
        quad([bx0, by1, 0], [bx1, by1, 0], [bx1, by1, bz], [bx0, by1, bz]);
        quad([bx1, by0, 0], [bx0, by0, 0], [bx0, by0, bz], [bx1, by0, bz]);
        quad([bx0, by0, 0], [bx0, by1, 0], [bx0, by1, bz], [bx0, by0, bz]);
        quad([bx1, by0, 0], [bx1, by0, bz], [bx1, by1, bz], [bx1, by1, 0]);

        // Hole walls (4 sides of the switch pocket)
        quad([hx0, hy1, 0], [hx0, hy1, bz], [hx1, hy1, bz], [hx1, hy1, 0]);
        quad([hx1, hy0, 0], [hx1, hy0, bz], [hx0, hy0, bz], [hx0, hy0, 0]);
        quad([hx0, hy0, 0], [hx0, hy0, bz], [hx0, hy1, bz], [hx0, hy1, 0]);
        quad([hx1, hy0, 0], [hx1, hy1, 0], [hx1, hy1, bz], [hx1, hy0, bz]);

        // ── 2. CASQUILLO (key cap) ──────────────────────────────────────
        const kz = baseD;
        const kx0 = -keyW / 2, kx1 = keyW / 2;
        const ky0 = -keyH / 2, ky1 = keyH / 2;
        const kt = kz + o.keyHeight;
        const tx0 = -TOP_SIZE / 2, tx1 = TOP_SIZE / 2;
        const ty0 = -TOP_SIZE / 2, ty1 = TOP_SIZE / 2;

        // Top face (z = kt), with the design carved into it
        for (let row = 0; row < o.gridH; row++) {
            for (let col = 0; col < o.gridW; col++) {
                const h00 = H(col, row), h10 = H(col + 1, row);
                const h01 = H(col, row + 1), h11 = H(col + 1, row + 1);
                const x0 = tx0 + (col / o.gridW) * (tx1 - tx0);
                const x1 = tx0 + ((col + 1) / o.gridW) * (tx1 - tx0);
                const y0 = ty0 + (row / o.gridH) * (ty1 - ty0);
                const y1 = ty0 + ((row + 1) / o.gridH) * (ty1 - ty0);
                const z00 = kt - h00, z10 = kt - h10, z01 = kt - h01, z11 = kt - h11;
                const zb = kt - o.carveDepth;
                quad([x0, y0, z00], [x1, y0, z10], [x1, y1, z11], [x0, y1, z01]);
                // Side walls of the carve (only at the boundary of the carve area
                // to avoid duplicate edges between adjacent cells).
                if (col === 0) quad([x0, y0, z00], [x0, y0, zb], [x0, y1, zb], [x0, y1, z01]);  // left
                if (col === o.gridW - 1) quad([x1, y0, z10], [x1, y0, zb], [x1, y1, zb], [x1, y1, z11]);  // right
                if (row === 0) quad([x0, y0, zb], [x1, y0, zb], [x1, y0, z10], [x0, y0, z00]);  // front
                if (row === o.gridH - 1) quad([x0, y1, z01], [x1, y1, z11], [x1, y1, zb], [x0, y1, zb]);  // back
            }
        }

        // Bottom of the carve (flat) — un único quad para toda el área
        // imprimible, evitando aristas duplicadas entre celdas.
        quad([tx0, ty0, kt - o.carveDepth], [tx1, ty0, kt - o.carveDepth],
             [tx1, ty1, kt - o.carveDepth], [tx0, ty1, kt - o.carveDepth]);

        // Bottom of the casquillo (z = kz), with the hole for the stem
        quad([kx0, ky1, kz], [tx0, ky1, kz], [tx0, ty1, kz], [kx0, ky0, kz]);
        quad([kx0, ky1, kz], [tx0, ty1, kz], [tx1, ty1, kz], [kx1, ky1, kz]);
        quad([kx0, ky0, kz], [tx0, ty0, kz], [tx0, ty1, kz], [kx0, ky1, kz]);
        quad([kx1, ky0, kz], [tx1, ty0, kz], [tx1, ty1, kz], [kx1, ky1, kz]);
        quad([tx0, ky0, kz], [tx1, ky0, kz], [tx1, ty0, kz], [tx0, ty0, kz]);
        quad([tx0, ky1, kz], [tx1, ty1, kz], [tx1, ky1, kz], [tx0, ky1, kz]);

        // Side walls of the casquillo (4 outer sides)
        quad([kx0, ky1, kz], [kx0, ky1, kt], [kx1, ky1, kt], [kx1, ky1, kz]);
        quad([kx1, ky0, kz], [kx1, ky0, kt], [kx0, ky0, kt], [kx0, ky0, kz]);
        quad([kx0, ky0, kz], [kx0, ky0, kt], [kx0, ky1, kt], [kx0, ky1, kz]);
        quad([kx1, ky0, kz], [kx1, ky1, kz], [kx1, ky1, kt], [kx1, ky0, kt]);

        // Hole walls (the switch stem hole) — a square hole
        const sx = MX_STEM / 2;
        quad([-sx, -sx, kz], [-sx, -sx, kt], [sx, -sx, kt], [sx, -sx, kz]);
        quad([sx, sx, kz], [sx, sx, kt], [-sx, sx, kt], [-sx, sx, kz]);
        quad([-sx, sx, kz], [-sx, sx, kt], [-sx, -sx, kt], [-sx, -sx, kz]);
        quad([sx, -sx, kz], [sx, -sx, kt], [sx, sx, kt], [sx, sx, kz]);

        // ── 3. KEYCHAIN LOOP (optional) ─────────────────────────────────
        if (o.keychain) {
            const loopR = 3.0, loopT = 1.5;
            const loopX = baseW / 2 + 2, loopY = 0, loopZ = baseD / 2;
            const segs = 12;
            for (let i = 0; i < segs; i++) {
                const a1 = (i / segs) * Math.PI * 2;
                const a2 = ((i + 1) / segs) * Math.PI * 2;
                const x1 = loopX + Math.cos(a1) * loopR, y1 = loopY + Math.sin(a1) * loopR;
                const x2 = loopX + Math.cos(a2) * loopR, y2 = loopY + Math.sin(a2) * loopR;
                quad([x1, y1, loopZ - loopT / 2], [x2, y2, loopZ - loopT / 2],
                     [x2, y2, loopZ + loopT / 2], [x1, y1, loopZ + loopT / 2]);
            }
        }

        // ── 4. Orientación ───────────────────────────────────────────────
        let minZ = Infinity;
        for (let i = 2; i < positions.length; i += 3) {
            if (positions[i] < minZ) minZ = positions[i];
        }
        if (minZ !== 0) {
            for (let i = 2; i < positions.length; i += 3) {
                positions[i] -= minZ;
            }
        }

        const triangles = positions.length / 9;
        const stats = {
            triangles: triangles,
            vertices: positions.length / 3,
            fileSize: 84 + triangles * 50,
            baseSize: [baseW, baseH, baseD],
            keySize: [keyW, keyH, o.keyHeight],
            carveDepth: o.carveDepth,
            gridW: o.gridW,
            gridH: o.gridH,
        };

        return { positions: new Float32Array(positions), stats: stats };
    }

    function checkWatertight(positions) {
        const edges = new Map();
        const key = (x, y, z) => Math.round(x * 1000) + '|' + Math.round(y * 1000) + '|' + Math.round(z * 1000);
        const triCount = positions.length / 9;
        for (let t = 0; t < triCount; t++) {
            const i = t * 9;
            const p = [
                [positions[i], positions[i + 1], positions[i + 2]],
                [positions[i + 3], positions[i + 4], positions[i + 5]],
                [positions[i + 6], positions[i + 7], positions[i + 8]],
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
            else if (rev === 0) open++;
            else if (rev > 1) flipped++;
        });
        return { closed: open === 0 && flipped === 0 && nonManifold === 0, open, flipped, nonManifold, triangles: triCount };
    }

    /** Build a base plate for multiple clickers */
    function buildBasePlate(baseW, baseH, baseThick) {
        const positions = [];
        const tri = (a, b, c) => { positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); };
        const quad = (a, b, c, d) => { tri(a, b, c); tri(a, c, d); };
        const bx0 = -baseW / 2, bx1 = baseW / 2;
        const by0 = -baseH / 2, by1 = baseH / 2;
        const bz = baseThick;
        // Top face
        quad([bx0, by0, bz], [bx1, by0, bz], [bx1, by1, bz], [bx0, by1, bz]);
        // Bottom face
        quad([bx0, by0, 0], [bx1, by0, 0], [bx1, by1, 0], [bx0, by1, 0]);
        // Side walls
        quad([bx0, by1, 0], [bx1, by1, 0], [bx1, by1, bz], [bx0, by1, bz]);
        quad([bx1, by0, 0], [bx0, by0, 0], [bx0, by0, bz], [bx1, by0, bz]);
        quad([bx0, by0, 0], [bx0, by1, 0], [bx0, by1, bz], [bx0, by0, bz]);
        quad([bx1, by0, 0], [bx1, by0, bz], [bx1, by1, bz], [bx1, by1, 0]);
        return new Float32Array(positions);
    }

    /** Build combined geometry for multiple clickers on a base plate */
    function buildMultiClicker(clickers, baseW, baseH, baseThick) {
        const allPositions = [];
        // Base plate
        const basePos = buildBasePlate(baseW, baseH, baseThick);
        for (let i = 0; i < basePos.length; i++) allPositions.push(basePos[i]);

        // Each clicker
        for (const c of clickers) {
            if (!c.pixels) continue;
            const result = buildClicker(c.pixels, c.imgW, c.imgH, {
                size: c.size,
                carveDepth: c.carveDepth,
                bright: c.brightness,
                contrast: c.contrast,
                invert: c.invert,
                gridW: 60,
                gridH: 60,
                keychain: c.keychain
            });
            // Translate clicker to its position on the base plate
            // The clicker's origin is at its center, z=0 at base bottom
            // We need to offset x, y by c.x, c.y and z by baseThick
            const rot = (c.rotation || 0) * Math.PI / 180;
            const cos = Math.cos(rot), sin = Math.sin(rot);
            for (let i = 0; i < result.positions.length; i += 3) {
                const lx = result.positions[i];
                const ly = result.positions[i + 1];
                const lz = result.positions[i + 2];
                // Rotate around Z
                const rx = lx * cos - ly * sin;
                const ry = lx * sin + ly * cos;
                // Translate
                allPositions.push(rx + c.x, ry + c.y, lz + baseThick);
            }
        }

        const triangles = allPositions.length / 9;
        const stats = {
            triangles: triangles,
            vertices: allPositions.length / 3,
            fileSize: 84 + triangles * 50,
            baseSize: [baseW, baseH, baseThick],
            clickerCount: clickers.filter(c => c.pixels).length
        };

        return { positions: new Float32Array(allPositions), stats: stats };
    }

    return { buildClicker: buildClicker, buildBasePlate: buildBasePlate, buildMultiClicker: buildMultiClicker, checkWatertight: checkWatertight };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ClickerGeometry;
}
