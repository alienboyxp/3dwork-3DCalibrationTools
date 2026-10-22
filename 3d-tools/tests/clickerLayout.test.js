// =====================================================
// clickerLayout.test.js – tests sin dependencias
// =====================================================
'use strict';

globalThis.window = globalThis;
const CL = require('../js/utils/clickerLayout.js');

let pass = 0, fail = 0;
function check(name, cond, extra) {
    if (cond) { pass++; console.log('  ✓ ' + name); }
    else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}

console.log('\n── Creación ──');
{
    const c = CL.createClicker({ size: '1u' });
    check('crea clicker con id', !!c.id, c.id);
    check('posición inicial (0,0)', c.x === 0 && c.y === 0);
    check('rotación inicial 0', c.rotation === 0);
}

console.log('\n── Bounding box ──');
{
    const c = CL.createClicker({ size: '1u', x: 10, y: 5 });
    const bb = CL.getBBox(c);
    check('bbox centrado', bb.minX === 10 - 12 && bb.maxX === 10 + 12,
        `${bb.minX}..${bb.maxX}`);
    check('bbox dimensiones', bb.w === 18 && bb.h === 18);
}

console.log('\n── Rotación ──');
{
    const c = CL.createClicker({ size: '2u', x: 0, y: 0 });
    CL.rotate(c, 90);
    const bb = CL.getBBox(c);
    check('rotación 90° intercambia w/h', bb.w === 37 && bb.h === 18,
        `${bb.w}×${bb.h}`);
}

console.log('\n── Colisiones ──');
{
    const a = CL.createClicker({ size: '1u', x: 0, y: 0 });
    const b = CL.createClicker({ size: '1u', x: 0, y: 0 });
    check('misma posición = colisión', CL.collides(a, b));
    const c = CL.createClicker({ size: '1u', x: 100, y: 100 });
    check('lejos = sin colisión', !CL.collides(a, c));
}

console.log('\n── Fits on base ──');
{
    const c = CL.createClicker({ size: '1u', x: 0, y: 0 });
    check('centro cabe en 60×60', CL.fitsOnBase(c, 60, 60));
    const c2 = CL.createClicker({ size: '1u', x: 100, y: 0 });
    check('fuera de base no cabe', !CL.fitsOnBase(c2, 60, 60));
}

console.log('\n── Auto-place ──');
{
    const existing = [];
    const c1 = CL.createClicker({ size: '1u' });
    check('auto-place c1', CL.autoPlace(c1, existing, 100, 100));
    existing.push(c1);
    const c2 = CL.createClicker({ size: '1u' });
    check('auto-place c2', CL.autoPlace(c2, existing, 100, 100));
    check('c2 no colisiona con c1', !CL.collides(c1, c2));
}

console.log('\n── Suggest base size ──');
{
    const clickers = [CL.createClicker({ size: '1u' }), CL.createClicker({ size: '1u' })];
    const [w, h] = CL.suggestBaseSize(clickers);
    check('base sugerida > 0', w > 0 && h > 0, `${w}×${h}`);
}

console.log('\n── Validación ──');
{
    const a = CL.createClicker({ size: '1u', x: 0, y: 0 });
    const b = CL.createClicker({ size: '1u', x: 0, y: 0 });
    const v = CL.validateLayout([a, b], 100, 100);
    check('colisión detectada', !v.valid && v.issues.length > 0);
    const c = CL.createClicker({ size: '1u', x: 0, y: 0 });
    const d = CL.createClicker({ size: "1u", x: 30, y: 30 });
    const v2 = CL.validateLayout([c, d], 100, 100);
    check('layout válido', v2.valid);
}

console.log('\n── Snap ──');
{
    const c = CL.createClicker({ size: '1u', x: 7.3, y: -3.7 });
    CL.snap(c, 5);
    check('snap a grid 5mm', c.x === 5 && c.y === -5, `${c.x}, ${c.y}`);
}

console.log(`\n${pass} correctas, ${fail} fallidas\n`);
process.exit(fail ? 1 : 0);
