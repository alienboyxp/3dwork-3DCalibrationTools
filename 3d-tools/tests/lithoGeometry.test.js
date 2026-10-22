// =====================================================
// lithoGeometry.test.js – tests sin dependencias
// Ejecutar: node 3d-tools/tests/lithoGeometry.test.js
// =====================================================
'use strict';

globalThis.window = globalThis;
const Litho = require('../js/utils/lithoGeometry.js');

let pass = 0, fail = 0;
function check(name, cond, extra) {
    if (cond) { pass++; console.log('  ✓ ' + name); }
    else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}

// ── imagen sintética: degradado horizontal (izquierda oscuro) ──────────
function makeImage(w, h) {
    const px = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const v = Math.round(255 * (1 - x / (w - 1)));
            const i = (y * w + x) * 4;
            px[i] = v; px[i + 1] = v; px[i + 2] = v; px[i + 3] = 255;
        }
    }
    return px;
}

function bbox(pos) {
    let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < pos.length; i += 3) {
        for (let k = 0; k < 3; k++) {
            if (pos[i + k] < min[k]) min[k] = pos[i + k];
            if (pos[i + k] > max[k]) max[k] = pos[i + k];
        }
    }
    return { min, max, size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]] };
}

const IMG = makeImage(120, 90);
const BASE = {
    width: 100, height: 75, baseT: 0.8, maxT: 3.0,
    bright: 1.0, contrast: 1.0, layerHeight: 0.15,
    res: 60, geom: 'flat', scaleMode: 'fill'
};

console.log('\n── Estanqueidad de la malla ──');
for (const geom of ['flat', 'cylindrical', 'curved']) {
    for (const upright of [true, false]) {
        const m = Litho.build(IMG, 120, 90, Object.assign({}, BASE, { geom, upright, curveAngle: 180 }));
        const w = Litho.checkWatertight(m.positions);
        check(`estanca · ${geom} · ${upright ? 'de pie' : 'tumbada'}`,
            w.closed,
            `abiertas=${w.open} invertidas=${w.flipped} no-manifold=${w.nonManifold}`);
    }
}

console.log('\n── Orientación de impresión ──');
{
    const up = Litho.build(IMG, 120, 90, Object.assign({}, BASE, { upright: true }));
    const bUp = bbox(up.positions);
    check('de pie: la altura de la imagen va en Z',
        Math.abs(bUp.size[2] - 75) < 0.01, `Z=${bUp.size[2].toFixed(2)}`);
    check('de pie: el grosor va en Y',
        Math.abs(bUp.size[1] - 3.0) < 0.01, `Y=${bUp.size[1].toFixed(2)}`);
    check('de pie: el ancho va en X',
        Math.abs(bUp.size[0] - 100) < 0.01, `X=${bUp.size[0].toFixed(2)}`);
    check('de pie: la base toca la cama (z min = 0)',
        Math.abs(bUp.min[2]) < 0.001, `zmin=${bUp.min[2]}`);

    const flat = Litho.build(IMG, 120, 90, Object.assign({}, BASE, { upright: false }));
    const bFl = bbox(flat.positions);
    check('tumbada: la altura de la imagen va en Y',
        Math.abs(bFl.size[1] - 75) < 0.01, `Y=${bFl.size[1].toFixed(2)}`);
    check('tumbada: el grosor va en Z',
        Math.abs(bFl.size[2] - 3.0) < 0.01, `Z=${bFl.size[2].toFixed(2)}`);
}

console.log('\n── Resolución vertical ligada a la altura de capa ──');
{
    const m = Litho.build(IMG, 120, 90, Object.assign({}, BASE, { layerHeight: 0.15, res: 60 }));
    // 75 mm / 0,15 mm = 500 filas (por debajo del tope de celdas)
    check('filas = altura / altura de capa (500)', m.stats.resY === 500, `resY=${m.stats.resY}`);
    const m2 = Litho.build(IMG, 120, 90, Object.assign({}, BASE, { layerHeight: 0.3, res: 60 }));
    check('filas = altura / altura de capa (250)', m2.stats.resY === 250, `resY=${m2.stats.resY}`);
}

console.log('\n── Cuantización a la altura de capa ──');
{
    const lh = 0.15;
    const m = Litho.build(IMG, 120, 90, Object.assign({}, BASE, { layerHeight: lh, upright: false }));
    let bad = 0;
    for (let i = 2; i < m.positions.length; i += 3) {
        const v = m.positions[i];
        if (Math.abs(v / lh - Math.round(v / lh)) > 1e-4) bad++;
    }
    check('todas las alturas son múltiplos de la altura de capa', bad === 0, `${bad} valores fuera`);
}

console.log('\n── Marco / borde ──');
{
    const m = Litho.build(IMG, 120, 90, Object.assign({}, BASE, { border: 2 }));
    const b = bbox(m.positions);
    check('el borde suma 2×2 mm al ancho', Math.abs(b.size[0] - 104) < 0.01, `X=${b.size[0].toFixed(2)}`);
    check('el borde suma 2×2 mm al alto', Math.abs(b.size[2] - 79) < 0.01, `Z=${b.size[2].toFixed(2)}`);
    const w = Litho.checkWatertight(m.positions);
    check('con borde la malla sigue siendo estanca', w.closed,
        `abiertas=${w.open} invertidas=${w.flipped}`);
}

console.log('\n── Curva ──');
{
    const m360 = Litho.build(IMG, 120, 90, Object.assign({}, BASE, { geom: 'cylindrical', curveAngle: 360, upright: true }));
    const b360 = bbox(m360.positions);
    // 360°: el arco developmentado mide el ancho → R = W/2π → diámetro = W/π
    // (más el grosor, que se suma al radio por fuera)
    check('cilindro 360°: diámetro ≈ ancho/π + grosor',
        b360.size[0] > 100 / Math.PI && b360.size[0] < 100 / Math.PI + 8,
        `X=${b360.size[0].toFixed(2)} base=${(100 / Math.PI).toFixed(2)}`);
    const w360 = Litho.checkWatertight(m360.positions);
    check('cilindro 360° estanco', w360.closed, `abiertas=${w360.open} invertidas=${w360.flipped}`);

    const m180 = Litho.build(IMG, 120, 90, Object.assign({}, BASE, { geom: 'cylindrical', curveAngle: 180, upright: true }));
    const b180 = bbox(m180.positions);
    // 180°: la cuerda es el diámetro = 2·R = 2·W/π (+ el grosor por fuera)
    check('cilindro 180°: cuerda ≈ 2·ancho/π',
        Math.abs(b180.size[0] - 200 / Math.PI) < 5, `X=${b180.size[0].toFixed(2)}`);
    const w180 = Litho.checkWatertight(m180.positions);
    check('cilindro 180° estanco', w180.closed, `abiertas=${w180.open} invertidas=${w180.flipped}`);

    const m90 = Litho.build(IMG, 120, 90, Object.assign({}, BASE, { geom: 'curved', curveAngle: 90, upright: true }));
    const w90 = Litho.checkWatertight(m90.positions);
    check('curva 90° estanca', w90.closed, `abiertas=${w90.open} invertidas=${w90.flipped}`);
}

console.log('\n── Muestreo (mapa de alturas) ──');
{
    // Imagen con mitad izquierda negra y derecha blanca
    const px = new Uint8ClampedArray(100 * 10 * 4);
    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 100; x++) {
            const i = (y * 100 + x) * 4;
            const v = x < 50 ? 0 : 255;
            px[i] = v; px[i + 1] = v; px[i + 2] = v; px[i + 3] = 255;
        }
    }
    const m = Litho.build(px, 100, 10, Object.assign({}, BASE, { upright: false, res: 40, resV: 40, border: 0, bright: 0.8, scaleMode: 'fit' }));
    const b = bbox(m.positions);
    // CONVENCIÓN DE LITOFANÍA: la mitad oscura es la gruesa (tapa la luz,
    // 3 mm) y la clara la fina (deja pasar la luz, 1,24 mm con brillo 0,8).
    check('la zona oscura es la gruesa',
        Math.abs(b.size[2] - 3.0) < 0.05, `grosor=${b.size[2].toFixed(2)} esperado=3.00`);
    // El punto más grueso debe estar en la mitad oscura (x negativa)
    let thickestX = 0, thickestZ = -1;
    for (let i = 0; i < m.positions.length; i += 3) {
        if (m.positions[i + 2] > thickestZ) { thickestZ = m.positions[i + 2]; thickestX = m.positions[i]; }
    }
    check('el punto más grueso cae en la mitad oscura',
        thickestX < -20, `x=${thickestX.toFixed(1)} (negativo = mitad izquierda)`);
    // Con el interruptor "invert" la relación se invierte: la zona clara
    // pasa a ser la gruesa.
    const mi = Litho.build(px, 100, 10, Object.assign({}, BASE, { upright: false, res: 40, resV: 40, border: 0, bright: 0.8, scaleMode: 'fit', invert: true }));
    const bi = bbox(mi.positions);
    check('con "invert" la zona clara es la gruesa',
        Math.abs(bi.size[2] - 2.55) < 0.05, `grosor=${bi.size[2].toFixed(2)} esperado=2.55`);
}

console.log('\n── Estadísticas ──');
{
    const m = Litho.build(IMG, 120, 90, BASE);
    check('triángulos = vértices/3', m.stats.triangles * 3 === m.stats.vertices);
    check('tamaño de fichero STL = 84 + 50·triángulos',
        m.stats.fileSize === 84 + m.stats.triangles * 50);
    check('nº de pasos de grosor calculado', m.stats.steps > 0, `steps=${m.stats.steps}`);
}

console.log(`\n${pass} correctas, ${fail} fallidas\n`);
process.exit(fail ? 1 : 0);
