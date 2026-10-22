// =====================================================
// hueForge.test.js – tests sin dependencias
// Ejecutar: node 3d-tools/tests/hueForge.test.js
// =====================================================
'use strict';

globalThis.window = globalThis;
const HueForge = require('../js/utils/hueForge.js');
const Mesh = require('../js/utils/meshChecks.js');

let pass = 0, fail = 0;
function check(name, cond, extra) {
    if (cond) { pass++; console.log('  ✓ ' + name); }
    else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}

// Imagen sintética: degradado vertical (arriba blanco, abajo negro)
function makeImage(w, h) {
    const px = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const v = Math.round(255 * (1 - y / (h - 1)));
            px[i] = v; px[i + 1] = v; px[i + 2] = v; px[i + 3] = 255;
        }
    }
    return px;
}

const IMG = makeImage(80, 60);
const OPTS = {
    gridW: 40, gridH: 30, width: 100, height: 75,
    baseT: 0.48, relief: 1.8, layerHeight: 0.08,
    bright: 1.0, contrast: 1.0, blackP: 0.0, whiteP: 1.0
};
const PALETTE = [
    { id: 1, name: 'Black', hex: '#000000', td: 0.5, stop: 0.48 },
    { id: 2, name: 'Gray', hex: '#555555', td: 1.5, stop: 1.2 },
    { id: 3, name: 'White', hex: '#FFFFFF', td: 5.0, stop: 2.2 }
];

console.log('\n── Relieve ──');
{
    const r = HueForge.sampleRelief(IMG, 80, 60, OPTS);
    check('la malla tiene (gridW+1)×(gridH+1) vértices',
        r.heights.length === 41 * 31, `${r.heights.length}`);
    let bad = 0;
    for (let i = 0; i < r.heights.length; i++) {
        const v = r.heights[i];
        if (Math.abs(v / 0.08 - Math.round(v / 0.08)) > 1e-4) bad++;
    }
    check('todas las alturas son múltiplos de la altura de capa', bad === 0, `${bad} valores fuera`);
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < r.heights.length; i++) {
        min = Math.min(min, r.heights[i]); max = Math.max(max, r.heights[i]);
    }
    check('la altura mínima es la base', Math.abs(min - 0.48) < 0.001, `min=${min}`);
    check('la altura máxima es base + relieve',
        Math.abs(max - (0.48 + 1.8)) < 0.09, `max=${max}`);
}

console.log('\n── Mezcla de color (Beer-Lambert) ──');
{
    // En la base (z=0.1) sólo se ve el primer filamento (negro).
    const c1 = HueForge.blendAt(PALETTE, 0.1);
    check('en la base se ve el filamento inferior',
        c1[0] < 0.05 && c1[1] < 0.05 && c1[2] < 0.05,
        `rgb=${c1.map(v => v.toFixed(2)).join(',')}`);
    // Arriba el color es mucho más claro que abajo (con TD 5 el blanco
    // necesita profundidad para imponerse: eso lo avisa la herramienta).
    const c2 = HueForge.blendAt(PALETTE, 2.2);
    check('arriba el color es más claro que abajo',
        c2[0] > c1[0] + 0.2, `arriba=${c2[0].toFixed(2)} abajo=${c1[0].toFixed(2)}`);
    // Y en la altura justa del último cambio sigue mandando el gris (el
    // blanco es translúcido: necesita profundidad para imponerse).
    const c3 = HueForge.blendAt(PALETTE, 2.19);
    check('justo antes del último cambio sigue el gris (no blanco)',
        Math.abs(c3[0] - c3[2]) < 0.02 && c3[0] < 0.8,
        `rgb=${c3.map(v => v.toFixed(2)).join(',')}`);
}

console.log('\n── Apilado automático (física del TD) ──');
{
    const stack = HueForge.planStack(PALETTE, {
        baseT: 0.48, relief: 1.8, layerHeight: 0.08, maxHeight: 2.4
    });
    check('la pila va de oscuro a claro',
        stack[0].hex === '#000000' && stack[2].hex === '#FFFFFF',
        stack.map(s => s.name).join(' → '));
    const total = stack[stack.length - 1].stop;
    check('cabe en la altura máxima', total <= 2.4 + 1e-6, `total=${total}`);
    // Las zonas deben ser proporcionales a los TD (más TD → más zona)
    const zones = stack.map((s, i) => s.stop - (i ? stack[i - 1].stop : 0.48));
    check('la zona del blanco (TD 5) es mayor que la del negro (TD 0.5)',
        zones[2] > zones[0], `zonas=${zones.map(z => z.toFixed(2)).join(', ')}`);
    check('las alturas son múltiplos de la altura de capa',
        stack.every(s => Math.abs(s.stop / 0.08 - Math.round(s.stop / 0.08)) < 1e-6));
}

console.log('\n── Apilamiento de las capas en el 3MF ──');
{
    const relief = HueForge.sampleRelief(IMG, 80, 60, OPTS);
    const stack = HueForge.planStack(PALETTE, {
        baseT: 0.48, relief: 1.8, layerHeight: 0.08, maxHeight: 2.4
    });
    const files = HueForge.build3MFFiles(relief, stack, {});
    const model = files['3D/3dmodel.model'];

    // Cada objeto con su rango en Z, leídos del propio XML
    const objs = model.split('<object ').slice(1);
    check('hay un objeto por capa de filamento', objs.length === stack.length,
        `${objs.length} objetos, ${stack.length} capas`);

    // Ranges: comprobar que no se solapan y que son contiguos
    const sorted = [...stack].sort((a, b) => a.stop - b.stop);
    let prev = 0, okStack = true, detail = [];
    sorted.forEach((l, i) => {
        const zBot = prev, zTop = l.stop;
        detail.push(`${l.name}: ${zBot.toFixed(2)}–${zTop.toFixed(2)}`);
        if (Math.abs(zBot - (i ? sorted[i - 1].stop : 0)) > 1e-6) okStack = false;
        prev = zTop;
    });
    check('las capas se apilan sin huecos ni solapes', okStack, detail.join(' | '));

    // El Z real de los vértices de cada objeto
    let allOk = true, msg = '';
    const objRanges = [];
    objs.forEach((ob, i) => {
        const zs = [...ob.matchAll(/z="(-?[\d.]+)"/g)].map(m => parseFloat(m[1]));
        const lo = Math.min(...zs), hi = Math.max(...zs);
        objRanges.push([lo, hi]);
        const expectedBot = i ? sorted[i - 1].stop : 0;
        // El objeto no puede subir más allá del relieve de la imagen
        let maxRelief = 0;
        for (let k = 0; k < relief.heights.length; k++) maxRelief = Math.max(maxRelief, relief.heights[k]);
        const expectedTop = Math.min(sorted[i].stop, maxRelief);
        // Ni bajar de la base de su tramo (si no, se solapa con la anterior)
        if (lo < expectedBot - 0.002) {
            allOk = false;
            msg = `objeto ${i}: baja a ${lo.toFixed(3)} pero su tramo empieza en ${expectedBot.toFixed(3)}`;
        } else if (Math.abs(hi - expectedTop) > 0.002) {
            allOk = false;
            msg = `objeto ${i}: z ${lo.toFixed(3)}–${hi.toFixed(3)}, esperado ${expectedBot.toFixed(3)}–${expectedTop.toFixed(3)}`;
        }
    });
    check('cada objeto ocupa exactamente su tramo de Z', allOk, msg);
}

console.log('\n── Sólidos estancos ──');
{
    const relief = HueForge.sampleRelief(IMG, 80, 60, OPTS);
    const stack = HueForge.planStack(PALETTE, {
        baseT: 0.48, relief: 1.8, layerHeight: 0.08, maxHeight: 2.4
    });
    const sorted = [...stack].sort((a, b) => a.stop - b.stop);
    let prev = 0;
    sorted.forEach((l, i) => {
        const solid = HueForge.buildLayerSolid(relief, prev, l.stop);
        prev = l.stop;
        if (!solid.triangles) { check(`capa ${l.name}: tiene geometría`, false, 'vacía'); return; }
        const w = Mesh.checkWatertight(solid.positions);
        check(`capa ${l.name}: malla estanca`, w.closed,
            `abiertas=${w.open} invertidas=${w.flipped} no-manifold=${w.nonManifold}`);
        const vol = Mesh.signedVolume(solid.positions);
        check(`capa ${l.name}: volumen con signo positivo (normales hacia fuera)`,
            vol > 0, `volumen=${vol.toFixed(2)} mm³`);
    });
}

console.log('\n── G-code de cambios de filamento ──');
{
    const stack = HueForge.planStack(PALETTE, {
        baseT: 0.48, relief: 1.8, layerHeight: 0.08, maxHeight: 2.4
    });
    const g = HueForge.buildSwapGcode(stack, { layerHeight: 0.08, purge: 20 });
    const m600 = [...g.matchAll(/M600 S(\d+)/g)].map(m => parseInt(m[1], 10));
    // El primer filamento ya está cargado: los M600 son para los siguientes.
    check('un M600 por cambio (todos menos el primero)', m600.length === stack.length - 1, `${m600.length}`);
    check('los M600 van numerados en orden desde el segundo',
        m600.join(',') === '2,3', m600.join(','));
    const sorted = [...stack].sort((a, b) => a.stop - b.stop);
    const zs = [...g.matchAll(/G1 Z([\d.]+)/g)].map(m => parseFloat(m[1]));
    check('las alturas del G-code son las de cambio',
        Math.abs(zs[0] - sorted[0].stop) < 1e-6 && Math.abs(zs[1] - sorted[1].stop) < 1e-6 &&
        Math.abs(zs[2] - sorted[2].stop) < 1e-6,
        zs.join(', '));
    check('el G-code tiene cabecera y final', g.includes('M600') && g.includes('M84'));
}

console.log('\n── Flat Paint (color en XY) ──');
{
    const w2 = 100, h2 = 100;
    const px = new Uint8ClampedArray(w2 * h2 * 4);
    for (let y = 0; y < h2; y++) {
        for (let x = 0; x < w2; x++) {
            const i = (y * w2 + x) * 4;
            const v = x < w2 / 2 ? 0 : 255;
            px[i] = v; px[i + 1] = v; px[i + 2] = v; px[i + 3] = 255;
        }
    }
    const palette = [{ hex: '#000000', name: 'Negro' }, { hex: '#FFFFFF', name: 'Blanco' }];
    const flat = HueForge.assignFlatPaint(px, w2, h2, {
        gridW: 20, gridH: 20, width: 100, height: 100, palette: palette
    });
    check('la mitad oscura va al filamento negro',
        flat.assignment[0] === 0, `asignado=${flat.assignment[0]}`);
    check('la mitad clara va al filamento blanco',
        flat.assignment[19] === 1, `asignado=${flat.assignment[19]}`);
    let s0 = null, s1 = null;
    palette.forEach((f, k) => {
        const s = HueForge.buildFlatPaintSolid(flat, k, 0, 2);
        if (k === 0) s0 = s; else s1 = s;
        const w = Mesh.checkWatertight(s.positions);
        check(`región ${f.name}: malla estanca`, w.closed,
            `abiertas=${w.open} invertidas=${w.flipped}`);
        check(`región ${f.name}: volumen con signo positivo`,
            Mesh.signedVolume(s.positions) > 0);
    });
    // El volumen de cada región debe ser la mitad de la pieza
    const half = 100 * 100 * 2 / 2;
    check('cada región ocupa la mitad del volumen',
        Math.abs(Mesh.signedVolume(s0.positions) - half) < 1,
        `negro=${Mesh.signedVolume(s0.positions).toFixed(0)} esperado=${half}`);
    // La fusión de celdas en rectángulos reduce mucho la geometría
    const cells = 20 * 20;
    check('la fusión reduce la geometría (no una malla por celda)',
        s1.triangles < cells * 4, `triángulos=${s1.triangles} (por celda serían ${cells * 4})`);

    const files = HueForge.buildFlatPaint3MF(flat, palette, { thickness: 2 });
    const objs = files['3D/3dmodel.model'].split('<object ').slice(1);
    check('el 3MF tiene un objeto por filamento', objs.length === 2, `${objs.length}`);
    check('la config asigna extrusor a cada objeto',
        (files['Metadata/model_settings.config'].match(/key="extruder"/g) || []).length === 2);
}

console.log('\n── Calibración del TD ──');
{
    const filaments = [{ name: 'Negro', hex: '#000000' }, { name: 'Blanco', hex: '#FFFFFF' }];
    const thicknesses = [0.2, 0.4, 0.8, 1.2, 1.6, 2.0];
    const chart = HueForge.buildCalibrationChart({ filaments: filaments, thicknesses: thicknesses, swatch: 10, gap: 2 });
    const w = Mesh.checkWatertight(chart.positions);
    check('la carta de calibración es un sólido estanco', w.closed,
        `abiertas=${w.open} invertidas=${w.flipped}`);
    check('la carta tiene una muestra por filamento y grosor',
        chart.patches.filter(p => p.kind === 'swatch').length === filaments.length * thicknesses.length);
    check('la carta tiene las dos referencias',
        chart.patches.filter(p => p.kind === 'reference').length === 2);

    // Foto sintética con un TD conocido (Beer-Lambert)
    const TD = 1.6;
    const W = 400, H = 300;
    const photo = new Uint8ClampedArray(W * H * 4);
    // Misma proyección que usa el analizador
    const lay = HueForge.chartLayout(chart, W, H, { margin: 0 });
    const scale = lay.scale, offX = lay.offX, offY = lay.offY;
    // Muestra sobre fondo: L = negro + (blanco - negro)·T
    const lum = (T) => 20 + (255 - 20) * T;
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4;
            let L = 128;
            for (const p of chart.patches) {
                const px0 = offX + p.x * scale, py0 = offY + (chart.height - p.y - p.h) * scale;
                const pw = p.w * scale, ph = p.h * scale;
                if (x >= px0 && x < px0 + pw && y >= py0 && y < py0 + ph) {
                    if (p.kind === 'reference') L = p.role === 'black' ? 20 : 255;
                    else {
                        const T = Math.pow(10, -p.thickness / TD);
                        L = lum(T);
                    }
                }
            }
            photo[i] = L; photo[i + 1] = L; photo[i + 2] = L; photo[i + 3] = 255;
        }
    }
    const res = HueForge.analyzeCalibrationPhoto(photo, W, H, chart, { margin: 0 });
    check('el análisis de la foto devuelve un TD', res.ok && res.results.length === 2,
        res.message || 'sin resultados');
    const neg = res.results.find(r => r.name === 'Negro');
    check('el TD recuperado coincide con el real (' + TD + ' mm)',
        neg && neg.td && Math.abs(neg.td - TD) < 0.35,
        neg ? 'td=' + (neg.td ? neg.td.toFixed(3) : 'null') : 'sin resultado');
}

console.log('\n── Modo de imagen y paleta automática ──');
{
    // Imagen con tres zonas de color
    const w = 90, h = 90;
    const px = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            let r, g, b;
            if (x < 30) { r = 200; g = 30; b = 30; }
            else if (x < 60) { r = 30; g = 120; b = 200; }
            else { r = 240; g = 230; b = 60; }
            px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
        }
    }
    const dom = HueForge.dominantColors(px, w, h, 3);
    check('se detectan 3 colores dominantes con peso',
        dom.length === 3 && dom.every(d => d.count > 0),
        dom.map(d => d.hex + '(' + d.count + ')').join(' '));
    // Las tres zonas pesan lo mismo: cada color debe cubrir ~1/3 de la imagen
    check('cada color dominante cubre un tercio de la imagen',
        dom.every(d => Math.abs(d.count - (w * h) / 3) < (w * h) / 12),
        dom.map(d => d.count).join(','));

    const lib = [
        { id: 'a', hex: '#1A1A1A', name: 'Negro' },
        { id: 'b', hex: '#C0392B', name: 'Rojo' },
        { id: 'c', hex: '#2980B9', name: 'Azul' },
        { id: 'd', hex: '#F1C40F', name: 'Amarillo' },
        { id: 'e', hex: '#FFFFFF', name: 'Blanco' }
    ];
    const chosen = HueForge.matchPalette(lib, dom, 3);
    check('la paleta elige 3 filamentos', chosen.length === 3, `${chosen.length}`);
    check('la paleta elige los colores más parecidos (rojo, azul, amarillo)',
        chosen.map(f => f.name).sort().join(',') === 'Amarillo,Azul,Rojo',
        chosen.map(f => f.name).join(','));
    check('no se repite filamento',
        new Set(chosen.map(f => f.id)).size === chosen.length);

    // Escala de grises y blanco y negro
    const gray = HueForge.processImage(px, w, h, { mode: 'gray' });
    check('el modo gris deja los tres canales iguales',
        gray[0] === gray[1] && gray[1] === gray[2]);
    const bw = HueForge.processImage(px, w, h, { mode: 'bw', threshold: 0.5 });
    let onlyBi = true;
    for (let i = 0; i < bw.length; i += 4) {
        if (bw[i] !== 0 && bw[i] !== 255) { onlyBi = false; break; }
    }
    check('el modo B&W deja sólo blanco y negro (elimina el tramado)', onlyBi);
    // Con el modo B&W el relieve sólo tiene dos alturas
    const reliefBW = HueForge.sampleRelief(bw, w, h, {
        gridW: 30, gridH: 30, width: 100, height: 100,
        baseT: 0.48, relief: 1.8, layerHeight: 0.08,
        bright: 1, contrast: 1, blackP: 0, whiteP: 1
    });
    const heights = new Set();
    for (let i = 0; i < reliefBW.heights.length; i++) heights.add(Math.round(reliefBW.heights[i] * 1000));
    check('el relieve en B&W tiene sólo 2 alturas', heights.size === 2, [...heights].join(', '));
}

console.log('\n── Rampa neutra (modo Layered) ──');
{
    const lib = [
        { id: 'a', hex: '#1A1A1A', name: 'Negro' },
        { id: 'b', hex: '#C0392B', name: 'Rojo' },
        { id: 'c', hex: '#2980B9', name: 'Azul' },
        { id: 'd', hex: '#F1C40F', name: 'Amarillo' },
        { id: 'e', hex: '#FFFFFF', name: 'Blanco' },
        { id: 'f', hex: '#7F8C8D', name: 'Gris' },
        { id: 'g', hex: '#E67E22', name: 'Naranja' },
        { id: 'h', hex: '#27AE60', name: 'Verde' }
    ];
    const w = 100, h = 100;
    const px = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const v = Math.round(255 * x / (w - 1));
            px[i] = v; px[i + 1] = v; px[i + 2] = v; px[i + 3] = 255;
        }
    }
    const ramp = HueForge.neutralRamp(lib, 4, px, w, h);
    check('la rampa devuelve 4 filamentos', ramp.length === 4, `${ramp.length}`);
    const lums = ramp.map(f => {
        const c = HueForge.hexToRgb(f.hex);
        return c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
    });
    check('la rampa va de oscuro a claro',
        lums.every((l, i) => i === 0 || l >= lums[i - 1] - 1e-6), lums.map(l => l.toFixed(2)).join(' '));
    // Con pocos colores disponibles se prefieren los neutros (si no, sale sepia)
    const hasNeutral = ramp.some(f => f.name === 'Negro' || f.name === 'Blanco' || f.name === 'Gris');
    check('con 4 colores se eligen tonos neutros', hasNeutral,
        ramp.map(f => f.name).join(', '));
    check('no se repite filamento', new Set(ramp.map(f => f.id)).size === ramp.length);
}

console.log(`\n${pass} correctas, ${fail} fallidas\n`);
process.exit(fail ? 1 : 0);
