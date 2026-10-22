// =====================================================
// hueForge.js – Motor de la técnica HueForge (Kromacut-like)
// =====================================================
//
// Ideas propias inspiradas en el trabajo público de Kromacut
// (AGPL-3.0: no se copia código, sólo el planteamiento).
//
// Qué resuelve:
//   1. El relieve de la imagen se cuantiza a la altura de capa (igual que
//      en la litofanía): lo que se diseña es lo que se imprime.
//   2. Las capas de filamento se apilan CORRECTAMENTE: cada objeto 3MF
//      ocupa su tramo en Z sin solaparse con el siguiente. (La versión
//      anterior usaba el grosor como coordenada Z y todos los objetos se
//      montaban en z=0, solapados.)
//   3. El apilado automático usa la distancia de ocultación (TD) de cada
//      filamento: la zona de cada color es proporcional a su TD, y si no
//      cabe en la altura máxima se escala TODO por el mismo factor (si se
//      escalan por separado, los colores salen mal).
//   4. Exporta los cambios de filamento en G-code (M600) para Klipper/Marlin
//      y en el 3MF para los impresores multicolor (Bambu Studio, Prusa).
//
// Sin dependencias. window.HueForge
// =====================================================

window.HueForge = (function () {
    'use strict';

    const clamp = (v, a, b) => (v < a ? a : (v > b ? b : v));

    function hexToRgb(hex) {
        let h = String(hex || '#000000').replace('#', '');
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        const n = parseInt(h, 16);
        return {
            r: ((n >> 16) & 255) / 255,
            g: ((n >> 8) & 255) / 255,
            b: (n & 255) / 255
        };
    }

    function luminance(hex) {
        const c = hexToRgb(hex);
        return c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
    }

    function roundTo(v, step) {
        if (!step) return v;
        return Math.round(v / step) * step;
    }

    // ── 1. Relieve de la imagen ────────────────────────────────────────
    /**
     * Muestrea la imagen y devuelve el mapa de alturas ABSOLUTAS (mm),
     * cuantizado a la altura de capa.
     * @returns {{gridW,gridH,xs,ys,heights,cellW,cellH}}
     */
    function sampleRelief(pixels, imgW, imgH, o) {
        const gridW = Math.max(4, o.gridW | 0);
        const gridH = Math.max(4, o.gridH | 0);
        const lh = o.layerHeight > 0 ? o.layerHeight : 0;
        const heights = new Float32Array((gridW + 1) * (gridH + 1));
        const xs = new Float32Array(gridW + 1), ys = new Float32Array(gridH + 1);
        for (let c = 0; c <= gridW; c++) xs[c] = (c / gridW - 0.5) * o.width;
        for (let r = 0; r <= gridH; r++) ys[r] = (0.5 - r / gridH) * o.height;

        // Filtro de caja: promedia el área que cubre cada celda (evita el
        // aliasing de muestream un solo píxel).
        const cellW = imgW / gridW, cellH = imgH / gridH;
        for (let row = 0; row <= gridH; row++) {
            for (let col = 0; col <= gridW; col++) {
                const x0 = (col / gridW) * imgW, y0 = (row / gridH) * imgH;
                const ix0 = clamp(Math.floor(x0), 0, imgW - 1);
                const iy0 = clamp(Math.floor(y0), 0, imgH - 1);
                const ix1 = clamp(Math.ceil(x0 + cellW), 1, imgW);
                const iy1 = clamp(Math.ceil(y0 + cellH), 1, imgH);
                let sum = 0, n = 0;
                for (let py = iy0; py < iy1; py++) {
                    for (let px = ix0; px < ix1; px++) {
                        const i = (py * imgW + px) * 4;
                        sum += (pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114) / 255;
                        n++;
                    }
                }
                let b = n ? sum / n : 0;
                // Niveles (punto de negro y blanco) + exposición/contraste
                b = clamp((b - o.blackP) / Math.max(0.01, o.whiteP - o.blackP), 0, 1);
                b = clamp((b - 0.5) * o.contrast + 0.5 + (o.bright - 1), 0, 1);
                let z = o.baseT + b * o.relief;
                if (lh > 0) z = roundTo(z, lh);
                heights[row * (gridW + 1) + col] = z;
            }
        }
        return {
            gridW: gridW, gridH: gridH, xs: xs, ys: ys, heights: heights,
            cellW: o.width / gridW, cellH: o.height / gridH
        };
    }

    // ── 2. Mezcla de color (Beer-Lambert) ───────────────────────────────
    /**
     * Color que se ve a la altura z con la pila de filamentos dada.
     * Las capas van de abajo (stop pequeño) a arriba.
     */
    function blendAt(layers, z) {
        let r = 0, g = 0, b = 0, prevStop = 0;
        for (let i = 0; i < layers.length; i++) {
            const l = layers[i];
            const start = prevStop;
            const stop = (i === layers.length - 1) ? Infinity : l.stop;
            const thick = Math.max(0, Math.min(z, stop) - start);
            if (thick > 0) {
                const c = hexToRgb(l.hex);
                const t = Math.pow(0.1, thick / Math.max(0.01, l.td));
                r = c.r * (1 - t) + r * t;
                g = c.g * (1 - t) + g * t;
                b = c.b * (1 - t) + b * t;
            }
            prevStop = stop;
        }
        return [r, g, b];
    }

    /** Colores por vértice para el preview (3 por vértice). */
    function blendGrid(layers, relief) {
        const n = (relief.gridW + 1) * (relief.gridH + 1);
        const out = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const c = blendAt(layers, relief.heights[i]);
            out[i * 3] = c[0]; out[i * 3 + 1] = c[1]; out[i * 3 + 2] = c[2];
        }
        return out;
    }

    // ── 3. Apilado automático con la física del TD ─────────────────────
    /**
     * Calcula la altura de cambio de cada filamento.
     * - La zona de cada color es proporcional a su TD (a más TD, más
     *   profundidad necesita para que el color se establezca).
     * - El primer filamento (el más oscuro) necesita además la base.
     * - Si no cabe en la altura máxima se escala TODO por el mismo factor:
     *   escalando cada alto por separado las proporciones se rompen y los
     *   colores salen distintos de lo previsto.
     */
    function planStack(layers, o) {
        const sorted = [...layers].sort((a, b) => luminance(a.hex) - luminance(b.hex));
        const lh = o.layerHeight > 0 ? o.layerHeight : 0;
        const budget = o.maxHeight;
        // La primera zona arranca en la base (el grosor mínimo de la pieza).
        // Cada color necesita una zona proporcional a su TD: a más TD
        // (filamento más transparente) más profundidad para que se imponga.
        let acc = o.baseT;
        const out = sorted.map((l, i) => {
            const zone = i === 0 ? Math.max(lh, l.td) : Math.max(lh, l.td * 0.5);
            acc += zone;
            return Object.assign({}, l, { stop: roundTo(acc, lh) });
        });
        const total = out.length ? out[out.length - 1].stop : 0;
        if (budget > 0 && total > budget && total > 0) {
            // Se escala TODO por el mismo factor (copia de los alturas
            // originales: si se leen ya escalados, el error se acumula).
            const original = out.map(l => l.stop);
            // La base (grosor mínimo) no se escala: sólo las zonas de color.
            const k = (budget - o.baseT) / Math.max(1e-6, total - o.baseT);
            let a2 = o.baseT;
            out.forEach((l, i) => {
                const zone = (original[i] - (i ? original[i - 1] : o.baseT)) * k;
                a2 += zone;
                l.stop = roundTo(a2, lh);
            });
        }
        return out;
    }

    // ── 4. Sólido de una capa (estanco) ────────────────────────────────
    /**
     * Construye el sólido de una capa de filamento: desde zBot hasta el
     * relieve de la imagen (limitado por zTop), con la cara superior
     * siguiendo el relieve, la inferior plana y las paredes donde el
     * material termina.
     */
    function buildLayerSolid(relief, zBot, zTop) {
        const { gridW, gridH, xs, ys, heights } = relief;
        const positions = [];
        const tri = (a, b, c) => { positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); };
        // La altura de la capa está recortada a su propio tramo [zBot, zTop]:
        // el material que queda por debajo de zBot es de la capa anterior y
        // el que sobresale de zTop es de la siguiente. Sin este recorte los
        // objetos del 3MF se solapan entre sí.
        const H = (col, row) =>
            Math.min(Math.max(heights[row * (gridW + 1) + col], zBot), zTop);

        // ¿La celda tiene material en esta capa?
        const filled = (col, row) => {
            const h00 = H(col, row), h10 = H(col + 1, row);
            const h01 = H(col, row + 1), h11 = H(col + 1, row + 1);
            return Math.max(h00, h10, h01, h11) > zBot + 1e-6;
        };

        for (let row = 0; row < gridH; row++) {
            for (let col = 0; col < gridW; col++) {
                if (!filled(col, row)) continue;
                const h00 = H(col, row), h10 = H(col + 1, row);
                const h01 = H(col, row + 1), h11 = H(col + 1, row + 1);
                const x0 = xs[col], x1 = xs[col + 1];
                const y0 = ys[row], y1 = ys[row + 1];
                const P = (x, y, h) => [x, y, h];
                const B = (x, y) => [x, y, zBot];

                // Cara superior (normal +Z)
                tri(P(x0, y0, h00), P(x0, y1, h01), P(x1, y1, h11));
                tri(P(x0, y0, h00), P(x1, y1, h11), P(x1, y0, h10));
                // Cara inferior (normal -Z)
                tri(B(x0, y0), B(x1, y1), B(x0, y1));
                tri(B(x0, y0), B(x1, y0), B(x1, y1));

                // Paredes: sólo donde el material se acaba. Si los dos
                // vértices de la arista están a la altura del suelo, la
                // pared tendría altura cero: el pliegue de la cara superior
                // con la inferior ya cierra el sólido y la pared duplicaría
                // aristas.
                // Pared entre dos aristas: si un vértice cae al suelo, el
                // cuadrilátero degenera en triángulo (si no, salen triángulos
                // de área cero con vértices repetidos y la malla deja de ser
                // estanca).
                // Con tolerancia: 0.72 calculado de dos maneras distintas puede
                // diferir en el último bit (0.7199999999 vs 0.7200000001).
                const same = (a, b) =>
                    Math.abs(a[0] - b[0]) < 1e-7 &&
                    Math.abs(a[1] - b[1]) < 1e-7 &&
                    Math.abs(a[2] - b[2]) < 1e-7;
                const quad = (A, Bq, C, D) => {
                    if (same(A, D)) { tri(A, Bq, C); return; }
                    if (same(Bq, C)) { tri(A, Bq, D); return; }
                    tri(A, Bq, C); tri(A, C, D);
                };
                const wall = (p, q, flip) => {
                    if (p[2] <= zBot + 1e-6 && q[2] <= zBot + 1e-6) return;
                    const A = B(p[0], p[1]), Bq = B(q[0], q[1]);
                    const C = [q[0], q[1], q[2]], D = [p[0], p[1], p[2]];
                    if (flip) quad(Bq, A, D, C); else quad(A, Bq, C, D);
                };
                // Abajo (la celda de abajo vacía) → normal -Y
                if (row + 1 >= gridH || !filled(col, row + 1)) {
                    wall([x0, y1, h01], [x1, y1, h11], false);
                }
                // Arriba (la celda de arriba vacía) → normal +Y
                if (row - 1 < 0 || !filled(col, row - 1)) {
                    wall([x0, y0, h00], [x1, y0, h10], true);
                }
                // Izquierda (la celda de la izquierda vacía) → normal -X
                if (col - 1 < 0 || !filled(col - 1, row)) {
                    wall([x0, y0, h00], [x0, y1, h01], false);
                }
                // Derecha (la celda de la derecha vacía) → normal +X
                if (col + 1 >= gridW || !filled(col + 1, row)) {
                    wall([x1, y0, h10], [x1, y1, h11], true);
                }
            }
        }
        return { positions: new Float32Array(positions), triangles: positions.length / 9 };
    }

    // ── 5. Ficheros del 3MF ────────────────────────────────────────────
    /**
     * Genera el 3MF con un objeto por capa de filamento.
     * @returns {Object} mapa {ruta: contenido}
     */
    function build3MFFiles(relief, layers, o) {
        const sorted = [...layers].sort((a, b) => a.stop - b.stop);
        const objects = [];
        let prevStop = 0;
        for (const l of sorted) {
            const zBot = prevStop, zTop = l.stop;
            prevStop = l.stop;
            if (zTop - zBot < 1e-6) continue;
            const solid = buildLayerSolid(relief, zBot, zTop);
            if (!solid.triangles) continue;
            objects.push({ layer: l, zBot: zBot, zTop: zTop, solid: solid });
        }

        let model = '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<model unit="millimeter" xml:lang="en-US" ' +
            'xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" ' +
            'xmlns:slic3rpe="http://schemas.slic3r.org/3mf/2017/06">\n' +
            '<metadata name="Application">3Dwork HueForge</metadata>\n' +
            '<resources>\n<basematerials id="0">\n';
        objects.forEach((ob) => {
            model += '<base name="' + escapeXml(ob.layer.name) + '" displaycolor="' +
                ob.layer.hex.replace('#', '').toUpperCase() + 'FF" />\n';
        });
        model += '</basematerials>\n';

        objects.forEach((ob, i) => {
            const p = ob.solid.positions;
            let v = '', t = '';
            for (let k = 0; k < p.length; k += 3) {
                v += '<vertex x="' + p[k].toFixed(3) + '" y="' + p[k + 1].toFixed(3) +
                    '" z="' + p[k + 2].toFixed(3) + '" />\n';
            }
            const n = p.length / 9;
            for (let k = 0; k < n; k++) {
                const a = k * 9 / 3;
                t += '<triangle v1="' + a + '" v2="' + (a + 1) + '" v3="' + (a + 2) + '" />\n';
            }
            model += '<object id="' + (i + 1) + '" type="model" pid="0" pindex="' + i + '">\n' +
                '<mesh>\n<vertices>\n' + v + '</vertices>\n<triangles>\n' + t +
                '</triangles>\n</mesh>\n</object>\n';
        });
        model += '</resources>\n<build>\n';
        objects.forEach((ob, i) => { model += '<item objectid="' + (i + 1) + '" />\n'; });
        model += '</build>\n</model>';

        // Configuración: un extrusor por capa + la altura de cambio, para
        // que el laminador asigne el filamento correcto a cada objeto.
        let cfg = '<?xml version="1.0" encoding="UTF-8"?>\n<config>\n';
        objects.forEach((ob, i) => {
            cfg += '<object id="' + (i + 1) + '">\n' +
                '<metadata key="extruder" value="' + (i + 1) + '" />\n' +
                '<metadata key="3dwork_hueforge_swap_z" value="' + ob.zBot.toFixed(3) + '" />\n' +
                '<metadata key="3dwork_hueforge_color" value="' + ob.layer.hex + '" />\n' +
                '</object>\n';
        });
        cfg += '</config>';

        return {
            '3D/3dmodel.model': model,
            'Metadata/model_settings.config': cfg,
            '[Content_Types].xml':
                '<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
                '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
                '<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>' +
                '</Types>',
            '_rels/.rels':
                '<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                '<Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>' +
                '</Relationships>'
        };
    }

    function escapeXml(s) {
        return String(s).replace(/[<>&'"]/g, c => ({
            '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
        }[c]));
    }

    // ── 6. G-code con los cambios de filamento ─────────────────────────
    /**
     * Genera un G-code con M600 en las alturas de cambio (Klipper y Marlin).
     * @param {Array} layers - la pila (con .stop)
     * @param {object} o - { startGcode, endGcode, purge }
     */
    function buildSwapGcode(layers, o) {
        const sorted = [...layers].sort((a, b) => a.stop - b.stop);
        const lh = o.layerHeight > 0 ? o.layerHeight : 0.08;
        const lines = [];
        lines.push('; ================================================');
        lines.push('; HueForge - cambios de filamento (M600)');
        lines.push('; Altura de capa: ' + lh + ' mm');
        lines.push('; Relleno 100% - sin espiral (spiral vase off) - sin soportes');
        lines.push('; El primer filamento de la pila es el que ya está cargado:');
        lines.push('; los M600 siguientes cargan el siguiente. Ajusta el índice');
        lines.push('; S<n> al de tus extrusores (Klipper: T0 = S0, Marlin: S0 = E0).');
        lines.push('; ================================================');
        lines.push('; Generado por 3Dwork.io/tools');
        lines.push('');
        lines.push('; --- Preparación (ajusta a tu impresora) ---');
        lines.push(o.startGcode || 'G28 ; HOME');
        lines.push('M83 ; posición relativa');
        lines.push('');
        let prev = 0;
        sorted.forEach((l, i) => {
            const z = l.stop;
            const dz = z - prev;
            if (dz > 0) {
                lines.push('G1 Z' + z.toFixed(3) + ' F' + (o.feedrate || 1200));
            }
            // El primer filamento de la pila es el que ya está cargado al
            // empezar: el M600 va para el SIGUIENTE.
            if (i > 0) {
                lines.push('; --- Cambio a ' + l.name + ' (' + l.hex + ') a ' + z.toFixed(3) + ' mm ---');
                lines.push('M600 S' + (i + 1) + ' ; ' + l.name);
                if (o.purge) {
                    lines.push('G1 E' + o.purge + ' F300 ; purga');
                    lines.push('G1 E-' + o.purge + ' F300');
                }
            }
            prev = z;
        });
        lines.push('');
        lines.push('; --- Final ---');
        lines.push(o.endGcode || 'M104 S0 ; apagar hotend');
        lines.push('M84 ; mover ejes');
        lines.push('G1 Z' + (prev + 5).toFixed(3) + ' ; subir para retirar');
        lines.push('M400 ; finish moves');
        lines.push('');
        return lines.join('\n');
    }

    return {
        sampleRelief: sampleRelief,
        blendAt: blendAt,
        blendGrid: blendGrid,
        planStack: planStack,
        buildLayerSolid: buildLayerSolid,
        build3MFFiles: build3MFFiles,
        buildSwapGcode: buildSwapGcode,
        hexToRgb: hexToRgb,
        luminance: luminance
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.HueForge;
}
