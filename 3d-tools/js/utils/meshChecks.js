// =====================================================
// meshChecks.js – Comprobaciones de malla reutilizables
// =====================================================
//
//   checkWatertight(positions) → cada arista dirigida debe aparecer
//     exactamente una vez y con su inversa: superficie cerrada y
//     bobinado uniforme (detecta caras invertidas, huecos y aristas
//     no-manifold).
//
//   signedVolume(positions) → el volumen con signo. Positivo = las
//     normales apuntan hacia fuera (el sólido está bien orientado);
//     negativo = está invertido.
//
// Sin dependencias. window.MeshChecks
// =====================================================

window.MeshChecks = (function () {
    'use strict';

    function key(x, y, z) {
        return Math.round(x * 1000) + '|' + Math.round(y * 1000) + '|' + Math.round(z * 1000);
    }

    /**
     * @param {Float32Array} positions - vértices sin indexar (9 floats por triángulo)
     * @returns {{closed:boolean, open:number, flipped:number, nonManifold:number, triangles:number}}
     */
    function checkWatertight(positions) {
        const edges = new Map();
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
            else if (rev === 0) open++;      // sin pareja → hueco
            else if (rev > 1) flipped++;     // más de una pareja → bobinado raro
        });
        return {
            closed: open === 0 && flipped === 0 && nonManifold === 0,
            open: open, flipped: flipped, nonManifold: nonManifold,
            triangles: triCount
        };
    }

    /**
     * Volumen con signo del sólido (método del tetraedro).
     * Positivo → las normales salen hacia fuera.
     */
    function signedVolume(positions) {
        const triCount = positions.length / 9;
        let vol = 0;
        for (let t = 0; t < triCount; t++) {
            const i = t * 9;
            const ax = positions[i], ay = positions[i + 1], az = positions[i + 2];
            const bx = positions[i + 3], by = positions[i + 4], bz = positions[i + 5];
            const cx = positions[i + 6], cy = positions[i + 7], cz = positions[i + 8];
            vol += (ax * (by * cz - bz * cy)
                - ay * (bx * cz - bz * cx)
                + az * (bx * cy - by * cx)) / 6;
        }
        return vol;
    }

    /** Bounding box de los vértices. */
    function bbox(positions) {
        const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
        for (let i = 0; i < positions.length; i += 3) {
            for (let k = 0; k < 3; k++) {
                if (positions[i + k] < min[k]) min[k] = positions[i + k];
                if (positions[i + k] > max[k]) max[k] = positions[i + k];
            }
        }
        return { min: min, max: max, size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]] };
    }

    return {
        checkWatertight: checkWatertight,
        signedVolume: signedVolume,
        bbox: bbox
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.MeshChecks;
}
