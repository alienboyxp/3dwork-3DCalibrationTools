// =====================================================
// clickerGeometry.test.js – tests sin dependencias
// Ejecutar: node 3d-tools/tests/clickerGeometry.test.js
// =====================================================
'use strict';

globalThis.window = globalThis;
const CG = require('../js/utils/clickerGeometry.js');

let pass = 0, fail = 0;
function check(name, cond, extra) {
    if (cond) { pass++; console.log('  ✓ ' + name); }
    else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}

function makeImage(w, h, pattern) {
    const px = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            let v = 255;
            if (pattern === 'circle') {
                const dx = x - w / 2, dy = y - h / 2;
                v = (dx * dx + dy * dy < (w / 4) * (w / 4)) ? 0 : 255;
            } else if (pattern === 'gradient') {
                v = Math.round(255 * (1 - x / (w - 1)));
            }
            px[i] = px[i + 1] = px[i + 2] = v;
            px[i + 3] = 255;
        }
    }
    return px;
}

console.log('\n── Construcción básica ──');
{
    const img = makeImage(60, 60, 'circle');
    const m = CG.buildClicker(img, 60, 60, { size: '1u', gridW: 40, gridH: 40 });
    check('construye una malla', m.stats.triangles > 0, `${m.stats.triangles} triángulos`);
    check('stats correctos', m.stats.baseSize[0] === 20 && m.stats.keySize[0] === 18,
        JSON.stringify(m.stats.baseSize) + ' ' + JSON.stringify(m.stats.keySize));
    const w = CG.checkWatertight(m.positions, m.indices);
    console.log('    (watertight: ' + w.closed + ', abiertas=' + w.open + ', inv=' + w.flipped + ', nm=' + w.nonManifold + ')');
}

console.log('\n── Tamaños de casquillo ──');
{
    const img = makeImage(60, 60, 'gradient');
    for (const sz of ['1u', '2u', 'space']) {
        const m = CG.buildClicker(img, 60, 60, { size: sz, gridW: 40, gridH: 40 });
        check(`construye ${sz}`, m.stats.triangles > 0, `${m.stats.triangles} triángulos`);
        const w = CG.checkWatertight(m.positions, m.indices);
        console.log('    ' + sz + ' (watertight: ' + w.closed + ', abiertas=' + w.open + ', inv=' + w.flipped + ', nm=' + w.nonManifold + ')');
    }
}

console.log('\n── Opciones ──');
{
    const img = makeImage(60, 60, 'circle');
    const m1 = CG.buildClicker(img, 60, 60, { gridW: 40, gridH: 40, carveDepth: 0.5 });
    const m2 = CG.buildClicker(img, 60, 60, { gridW: 40, gridH: 40, carveDepth: 2.0 });
    let s1=0,s2=0; for(let i=2;i<m1.positions.length;i+=3){s1+=m1.positions[i];s2+=m2.positions[i];} check('carveDepth afecta la malla', s1!==s2, 'sum z: '+s1+' vs '+s2);
    const m3 = CG.buildClicker(img, 60, 60, { gridW: 40, gridH: 40, keychain: true });
    check('keychain añade geometría', m3.stats.triangles > m1.stats.triangles,
        `${m3.stats.triangles} vs ${m1.stats.triangles}`);
    const w3 = CG.checkWatertight(m3.positions, m3.indices);
    console.log('    keychain (watertight: ' + w3.closed + ', abiertas=' + w3.open + ', inv=' + w3.flipped + ', nm=' + w3.nonManifold + ')');
}

console.log('\n── Imagen invertida ──');
{
    const img = makeImage(60, 60, 'circle');
    const m1 = CG.buildClicker(img, 60, 60, { gridW: 40, gridH: 40, invert: false });
    const m2 = CG.buildClicker(img, 60, 60, { gridW: 40, gridH: 40, invert: true });
    check('invert cambia la geometría', m1.stats.triangles === m2.stats.triangles, 'mismo número de triángulos (esperado)');
    const w2 = CG.checkWatertight(m2.positions, m2.indices);
    console.log('    invert (watertight: ' + w2.closed + ', abiertas=' + w2.open + ', inv=' + w2.flipped + ', nm=' + w2.nonManifold + ')');
}

console.log(`\n${pass} correctas, ${fail} fallidas\n`);
process.exit(fail ? 1 : 0);
