// =====================================================
// cmykLitho.test.js – tests del modo CMYK (AMS)
// Ejecutar: node 3d-tools/tests/cmykLitho.test.js
//
// Método (demo oficial de Bambu / lithophanemaker):
//   4 placas apiladas en una pieza tumbada. Grosor
//   cian ∝ 1-R, magenta ∝ 1-G, amarillo ∝ 1-B y blanca
//   ∝ 1-luminancia. Claro = fino, oscuro = grueso.
// =====================================================
'use strict';

globalThis.window = globalThis;
const Litho = require('../js/utils/lithoGeometry.js');

let pass = 0, fail = 0;
function check(name, cond, extra) {
    if (cond) { pass++; console.log('  ✓ ' + name); }
    else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}

// ── helpers ────────────────────────────────────────────
/** Imagen de color plano (r,g,b en 0-255). */
function solidImage(w, h, r, g, b) {
    const px = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < px.length; i += 4) {
        px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
    }
    return px;
}

/** Imagen con degradado de color (para alturas variadas). */
function gradientImage(w, h) {
    const px = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            px[i] = Math.round(255 * (1 - x / (w - 1)));
            px[i + 1] = Math.round(255 * (y / (h - 1)));
            px[i + 2] = Math.round(255 * ((x / (w - 1) + y / (h - 1)) / 2));
            px[i + 3] = 255;
        }
    }
    return px;
}

/** Rango Z (min,max) de una malla de posiciones planas. */
function zRange(pos) {
    let min = Infinity, max = -Infinity;
    for (let i = 2; i < pos.length; i += 3) {
        if (pos[i] < min) min = pos[i];
        if (pos[i] > max) max = pos[i];
    }
    return { min: min, max: max, size: max - min };
}

function near(a, b, tol) { return Math.abs(a - b) <= (tol || 1e-6); }

const IMG_W = 40, IMG_H = 30;
// layerHeight 0 → sin cuantizar: grosores y offsets EXACTOS.
const OPT = {
    width: 100, height: 75, res: 40,
    bright: 1.0, contrast: 1.0, gamma: 1, smoothing: 0,
    layerHeight: 0
};
const WHITE_BASE = 0.6, WHITE_MAX = 3.0, COLOR_BASE = 0.4, COLOR_MAX = 1.6;
const cmykOpt = (extra) => Object.assign({
    cmykWhiteBase: WHITE_BASE, cmykWhiteMax: WHITE_MAX,
    cmykColorBase: COLOR_BASE, cmykColorMax: COLOR_MAX
}, OPT, extra || {});
const plate = (built, name) => built.plates.find(p => p.name === name);

console.log('\n── sampleBox por canal ──');
{
    const red = solidImage(4, 4, 255, 0, 0);
    check("canal 'r' de imagen roja = 1", near(Litho.sampleBox(red, 4, 4, 0, 0, 4, 4, 'r'), 1));
    check("canal 'g' de imagen roja = 0", near(Litho.sampleBox(red, 4, 4, 0, 0, 4, 4, 'g'), 0));
    check("canal 'b' de imagen roja = 0", near(Litho.sampleBox(red, 4, 4, 0, 0, 4, 4, 'b'), 0));
    check('sin canal = luminancia (rojo → 0.299)',
        near(Litho.sampleBox(red, 4, 4, 0, 0, 4, 4), 0.299));
}

console.log('\n── build(): channel por defecto no rompe nada ──');
{
    const img = gradientImage(IMG_W, IMG_H);
    const a = Litho.build(img, IMG_W, IMG_H, Object.assign({}, OPT, { upright: false }));
    const b = Litho.build(img, IMG_W, IMG_H, Object.assign({}, OPT, { upright: false, channel: 'luma' }));
    check('sin channel ≡ channel luma (misma malla)',
        a.positions.length === b.positions.length &&
        a.positions.every((v, i) => v === b.positions[i]));
    const c = Litho.build(img, IMG_W, IMG_H, Object.assign({}, OPT, { upright: false, channel: 'r' }));
    check("channel 'r' produce una malla DISTINTA",
        c.positions.length === a.positions.length &&
        !c.positions.every((v, i) => v === a.positions[i]));
}

console.log('\n── Descomposición determinista de canales ──');
{
    // Rojo puro (R=1): cian fina (1-R=0), magenta/amarillo gruesas,
    // blanca intermedia (luma 0.299 → grosor 1-0.299).
    const red = solidImage(IMG_W, IMG_H, 255, 0, 0);
    const built = Litho.buildCmyk(red, IMG_W, IMG_H, cmykOpt());
    check('imagen roja: placa cian FINA (grosor = base)',
        near(zRange(plate(built, 'cyan').positions).size, COLOR_BASE, 1e-6),
        `grosor=${zRange(plate(built, 'cyan').positions).size}`);
    check('imagen roja: placa magenta GRUESA (grosor = máx)',
        near(zRange(plate(built, 'magenta').positions).size, COLOR_MAX, 1e-6),
        `grosor=${zRange(plate(built, 'magenta').positions).size}`);
    check('imagen roja: placa amarilla GRUESA (grosor = máx)',
        near(zRange(plate(built, 'yellow').positions).size, COLOR_MAX, 1e-6));
    // blanca: 0.6 + (1-0.299)·(3.0-0.6) = 2.2824
    check('imagen roja: blanca intermedia = 0.6 + 0.701·2.4',
        near(zRange(plate(built, 'white').positions).size, 0.6 + 0.701 * 2.4, 1e-3),
        `grosor=${zRange(plate(built, 'white').positions).size}`);

    // Verde puro: magenta fina; azul puro: amarilla fina.
    const green = solidImage(IMG_W, IMG_H, 0, 255, 0);
    const bg = Litho.buildCmyk(green, IMG_W, IMG_H, cmykOpt());
    check('imagen verde: placa magenta FINA',
        near(zRange(plate(bg, 'magenta').positions).size, COLOR_BASE, 1e-6));
    check('imagen verde: cian y amarilla GRUESAS',
        near(zRange(plate(bg, 'cyan').positions).size, COLOR_MAX, 1e-6) &&
        near(zRange(plate(bg, 'yellow').positions).size, COLOR_MAX, 1e-6));
    const blue = solidImage(IMG_W, IMG_H, 0, 0, 255);
    const bb = Litho.buildCmyk(blue, IMG_W, IMG_H, cmykOpt());
    check('imagen azul: placa amarilla FINA',
        near(zRange(plate(bb, 'yellow').positions).size, COLOR_BASE, 1e-6));
    check('imagen azul: cian y magenta GRUESAS',
        near(zRange(plate(bb, 'cyan').positions).size, COLOR_MAX, 1e-6) &&
        near(zRange(plate(bb, 'magenta').positions).size, COLOR_MAX, 1e-6));

    // Blanca pura: todo los canales a 1 → TODAS las placas finas.
    const white = solidImage(IMG_W, IMG_H, 255, 255, 255);
    const bw = Litho.buildCmyk(white, IMG_W, IMG_H, cmykOpt());
    ['white', 'cyan', 'magenta', 'yellow'].forEach(n => {
        check(`imagen blanca: placa ${n} FINA (grosor = base)`,
            near(zRange(plate(bw, n).positions).size, n === 'white' ? WHITE_BASE : COLOR_BASE, 1e-6),
            `grosor=${zRange(plate(bw, n).positions).size}`);
    });

    // Negra pura: todos los canales a 0 → TODAS las placas gruesas.
    const black = solidImage(IMG_W, IMG_H, 0, 0, 0);
    const bk = Litho.buildCmyk(black, IMG_W, IMG_H, cmykOpt());
    ['white', 'cyan', 'magenta', 'yellow'].forEach(n => {
        check(`imagen negra: placa ${n} GRUESA (grosor = máx)`,
            near(zRange(plate(bk, n).positions).size, n === 'white' ? WHITE_MAX : COLOR_MAX, 1e-6),
            `grosor=${zRange(plate(bk, n).positions).size}`);
    });

    // Determinista: la misma imagen da siempre la misma malla.
    const again = Litho.buildCmyk(red, IMG_W, IMG_H, cmykOpt());
    check('buildCmyk es determinista (misma entrada → misma malla)',
        built.plates.every((p, i) =>
            p.positions.length === again.plates[i].positions.length &&
            p.positions.every((v, k) => v === again.plates[i].positions[k])));
}

console.log('\n── Offsets Z acumulados (blanca debajo → amarilla arriba) ──');
{
    const black = solidImage(IMG_W, IMG_H, 0, 0, 0);
    const built = Litho.buildCmyk(black, IMG_W, IMG_H, cmykOpt());
    const expect = [
        ['white', 0, WHITE_MAX],
        ['cyan', WHITE_MAX, WHITE_MAX + COLOR_MAX],
        ['magenta', WHITE_MAX + COLOR_MAX, WHITE_MAX + 2 * COLOR_MAX],
        ['yellow', WHITE_MAX + 2 * COLOR_MAX, WHITE_MAX + 3 * COLOR_MAX]
    ];
    expect.forEach(([n, z0, z1]) => {
        const zr = zRange(plate(built, n).positions);
        check(`${n}: z ∈ [${z0}, ${z1}]`,
            near(zr.min, z0, 1e-6) && near(zr.max, z1, 1e-6),
            `z=[${zr.min}, ${zr.max}]`);
    });
    // La cara trasera de cada placa es PLANA (está en su offset).
    const cy = plate(built, 'cyan');
    let flatBack = true;
    for (let i = 2; i < cy.positions.length; i += 3) {
        if (near(cy.positions[i], WHITE_MAX, 1e-9)) continue;
        if (cy.positions[i] < WHITE_MAX + 1e-9) { flatBack = false; break; }
    }
    check('cyan: cara trasera plana en su offset (sin z < offset)', flatBack);
    check('orden: minZ creciente de blanca a amarilla',
        zRange(plate(built, 'white').positions).min < zRange(plate(built, 'cyan').positions).min &&
        zRange(plate(built, 'cyan').positions).min < zRange(plate(built, 'magenta').positions).min &&
        zRange(plate(built, 'magenta').positions).min < zRange(plate(built, 'yellow').positions).min);
    check('stats: altura de la pila = whiteMax + 3·colorMax',
        near(built.stats.stackMM, WHITE_MAX + 3 * COLOR_MAX, 1e-6),
        `stackMM=${built.stats.stackMM}`);
}

console.log('\n── Cuantización: offsets a altura de capa, sin solapes ──');
{
    // whiteMax=3.0 con lh=0.08 → pico y offset cuantizados a 3.04.
    const black = solidImage(IMG_W, IMG_H, 0, 0, 0);
    const built = Litho.buildCmyk(black, IMG_W, IMG_H, cmykOpt({ layerHeight: 0.08 }));
    const w = zRange(plate(built, 'white').positions);
    const c = zRange(plate(built, 'cyan').positions);
    check('con lh=0.08 el offset de cyan es múltiplo de capa (3.04)',
        near(plate(built, 'cyan').zOffset, 0.08 * Math.round(3.0 / 0.08), 1e-9),
        `zOffset=${plate(built, 'cyan').zOffset}`);
    check('sin solape: la cara trasera de cyan ≥ pico de la blanca',
        c.min >= w.max - 1e-9, `cyan z=${c.min} vs blanco z máx=${w.max}`);
    const m = zRange(plate(built, 'magenta').positions);
    check('sin solape: la cara trasera de magenta ≥ pico de cyan',
        m.min >= c.max - 1e-9, `magenta z=${m.min} vs cyan z máx=${c.max}`);
}

console.log('\n── Malla estanca (las 4 placas) ──');
{
    const img = gradientImage(IMG_W, IMG_H);
    const built = Litho.buildCmyk(img, IMG_W, IMG_H, cmykOpt());
    built.plates.forEach(p => {
        const wt = Litho.checkWatertight(p.positions);
        check(`estanca · ${p.name}`, wt.closed,
            `abiertas=${wt.open} invertidas=${wt.flipped} no-manifold=${wt.nonManifold}`);
    });
    check('las 4 placas: nombres/extrusores correctos',
        built.plates.map(p => p.name + ':' + p.extruder).join(' ') ===
        'white:1 cyan:2 magenta:3 yellow:4');
    check('resolución de color por defecto = max(8, res/4)',
        built.stats.colorRes === Math.max(8, Math.round(40 / 4)),
        `colorRes=${built.stats.colorRes}`);
    const fine = Litho.buildCmyk(img, IMG_W, IMG_H, cmykOpt({ res: 20 }));
    check('mínimo de resolución de color = 8 (con res=20 → max(8,5))',
        fine.stats.colorRes === 8, `colorRes=${fine.stats.colorRes}`);
}

console.log(`\n${pass} correctas, ${fail} fallidas\n`);
process.exit(fail ? 1 : 0);
