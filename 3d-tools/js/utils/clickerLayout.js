// =====================================================
// clickerLayout.js – Layout engine for multi-clicker
// =====================================================
// Manages multiple clicker instances on a base plate.
// Each clicker has position, rotation, size, image, settings.
// Detects collisions using bounding boxes (perimeter awareness).
//
// Sin dependencias. window.ClickerLayout
// =====================================================

window.ClickerLayout = (function () {
    'use strict';

    const clamp = (v, a, b) => (v < a ? a : (v > b ? b : v));

    const KEY_SIZES = { '1u': [18, 18], '2u': [18, 37], 'space': [18, 114] };
    const BASE_MARGIN = 3;  // mm margin around clickers on base plate

    /** Create a new clicker instance */
    function createClicker(opts) {
        return {
            id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
            x: 0,
            y: 0,
            rotation: 0,  // 0, 90, 180, 270
            size: '1u',
            carveDepth: 1.2,
            brightness: 0.5,
            contrast: 1.0,
            invert: false,
            keychain: false,
            pixels: null,
            imgW: 0,
            imgH: 0,
            imageUrl: null,
            ...opts
        };
    }

    /** Get the bounding box of a clicker (in mm, centered at origin) */
    function getBBox(clicker) {
        const [w, h] = KEY_SIZES[clicker.size] || KEY_SIZES['1u'];
        const [bw, bh] = clicker.rotation % 180 === 0 ? [w, h] : [h, w];
        const halfW = bw / 2 + BASE_MARGIN;
        const halfH = bh / 2 + BASE_MARGIN;
        return {
            minX: clicker.x - halfW,
            maxX: clicker.x + halfW,
            minY: clicker.y - halfH,
            maxY: clicker.y + halfH,
            w: bw,
            h: bh
        };
    }

    /** Check if two clickers overlap */
    function collides(a, b) {
        const ba = getBBox(a);
        const bb = getBBox(b);
        return !(ba.maxX <= bb.minX || bb.maxX <= ba.minX ||
                 ba.maxY <= bb.minY || bb.maxY <= ba.minY);
    }

    /** Check if a clicker fits on the base plate */
    function fitsOnBase(clicker, baseW, baseH) {
        const bb = getBBox(clicker);
        return bb.minX >= -baseW / 2 && bb.maxX <= baseW / 2 &&
               bb.minY >= -baseH / 2 && bb.maxY <= baseH / 2;
    }

    /** Auto-place a clicker on the base plate (find first free spot) */
    function autoPlace(clicker, existingClickers, baseW, baseH) {
        const [w, h] = KEY_SIZES[clicker.size] || KEY_SIZES['1u'];
        const step = 5;  // mm step for scanning
        const halfBaseW = baseW / 2 - w / 2 - BASE_MARGIN;
        const halfBaseH = baseH / 2 - h / 2 - BASE_MARGIN;

        for (let y = -halfBaseH; y <= halfBaseH; y += step) {
            for (let x = -halfBaseW; x <= halfBaseW; x += step) {
                clicker.x = x;
                clicker.y = y;
                // Check collision with existing clickers
                let collision = false;
                for (const other of existingClickers) {
                    if (other.id === clicker.id) continue;
                    if (collides(clicker, other)) { collision = true; break; }
                }
                if (!collision && fitsOnBase(clicker, baseW, baseH)) {
                    return true;
                }
            }
        }
        return false;  // No free spot found
    }

    /** Calculate the base plate size needed for N clickers */
    function suggestBaseSize(clickers) {
        if (clickers.length === 0) return [60, 60];
        // Simple heuristic: arrange in a grid
        const n = clickers.length;
        const cols = Math.ceil(Math.sqrt(n));
        const rows = Math.ceil(n / cols);
        // Estimate max clicker size
        let maxW = 0, maxH = 0;
        for (const c of clickers) {
            const [w, h] = KEY_SIZES[c.size] || KEY_SIZES['1u'];
            maxW = Math.max(maxW, w);
            maxH = Math.max(maxH, h);
        }
        const baseW = cols * (maxW + BASE_MARGIN * 2) + BASE_MARGIN * 2;
        const baseH = rows * (maxH + BASE_MARGIN * 2) + BASE_MARGIN * 2;
        // Round up to nearest 10mm
        return [Math.ceil(baseW / 10) * 10, Math.ceil(baseH / 10) * 10];
    }

    /** Get all clickers that overlap with a given clicker */
    function getCollisions(clicker, clickers) {
        const result = [];
        for (const other of clickers) {
            if (other.id === clicker.id) continue;
            if (collides(clicker, other)) result.push(other);
        }
        return result;
    }

    /** Validate the layout: check all clickers fit and don't overlap */
    function validateLayout(clickers, baseW, baseH) {
        const issues = [];
        for (let i = 0; i < clickers.length; i++) {
            for (let j = i + 1; j < clickers.length; j++) {
                if (collides(clickers[i], clickers[j])) {
                    issues.push({ type: 'collision', a: clickers[i].id, b: clickers[j].id });
                }
            }
            if (!fitsOnBase(clickers[i], baseW, baseH)) {
                issues.push({ type: 'out_of_bounds', id: clickers[i].id });
            }
        }
        return { valid: issues.length === 0, issues };
    }

    /** Rotate a clicker by 90 degrees */
    function rotate(clicker, degrees) {
        clicker.rotation = (clicker.rotation + degrees) % 360;
    }

    /** Move a clicker by delta */
    function move(clicker, dx, dy) {
        clicker.x += dx;
        clicker.y += dy;
    }

    /** Snap position to grid */
    function snap(clicker, gridSize) {
        clicker.x = Math.round(clicker.x / gridSize) * gridSize;
        clicker.y = Math.round(clicker.y / gridSize) * gridSize;
    }

    return {
        createClicker, getBBox, collides, fitsOnBase, autoPlace,
        suggestBaseSize, getCollisions, validateLayout, rotate, move, snap,
        KEY_SIZES, BASE_MARGIN
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ClickerLayout;
}