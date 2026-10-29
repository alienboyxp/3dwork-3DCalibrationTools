// =====================================================
// STL Exporter Utility
// Generates a watertight (closed back) binary STL
// from a THREE.BufferGeometry
// =====================================================

window.STLExporterUtil = {
    /**
     * Export a BufferGeometry to a binary STL ArrayBuffer.
     * @param {THREE.BufferGeometry} geometry
     * @returns {ArrayBuffer}
     */
    exportToBinarySTL: function (geometry) {
        const posAttr = geometry.getAttribute('position');
        const index = geometry.getIndex();

        let triangles;
        if (index) {
            triangles = index.count / 3;
        } else {
            triangles = posAttr.count / 3;
        }

        const headerBytes = 80;
        const buffer = new ArrayBuffer(headerBytes + 4 + triangles * 50);
        const view = new DataView(buffer);

        // Write header (80 bytes ASCII)
        const header = '3Dwork.io Lithophane/HueForge STL Export';
        for (let i = 0; i < 80; i++) {
            view.setUint8(i, i < header.length ? header.charCodeAt(i) : 0);
        }
        // Triangle count
        view.setUint32(80, triangles, true);

        const vA = new THREE.Vector3();
        const vB = new THREE.Vector3();
        const vC = new THREE.Vector3();
        const cb = new THREE.Vector3();
        const ab = new THREE.Vector3();

        let offset = 84;
        for (let i = 0; i < triangles; i++) {
            let a, b, c;
            if (index) {
                a = index.getX(i * 3);
                b = index.getX(i * 3 + 1);
                c = index.getX(i * 3 + 2);
            } else {
                a = i * 3;
                b = i * 3 + 1;
                c = i * 3 + 2;
            }

            vA.fromBufferAttribute(posAttr, a);
            vB.fromBufferAttribute(posAttr, b);
            vC.fromBufferAttribute(posAttr, c);

            // Compute face normal
            cb.subVectors(vC, vB);
            ab.subVectors(vA, vB);
            cb.cross(ab).normalize();

            // Normal
            view.setFloat32(offset, cb.x, true); offset += 4;
            view.setFloat32(offset, cb.y, true); offset += 4;
            view.setFloat32(offset, cb.z, true); offset += 4;
            // Vertex A
            view.setFloat32(offset, vA.x, true); offset += 4;
            view.setFloat32(offset, vA.y, true); offset += 4;
            view.setFloat32(offset, vA.z, true); offset += 4;
            // Vertex B
            view.setFloat32(offset, vB.x, true); offset += 4;
            view.setFloat32(offset, vB.y, true); offset += 4;
            view.setFloat32(offset, vB.z, true); offset += 4;
            // Vertex C
            view.setFloat32(offset, vC.x, true); offset += 4;
            view.setFloat32(offset, vC.y, true); offset += 4;
            view.setFloat32(offset, vC.z, true); offset += 4;
            // Attribute byte count
            view.setUint16(offset, 0, true); offset += 2;
        }

        return buffer;
    },

    /**
     * Trigger browser download of STL data.
     * @param {ArrayBuffer} buffer
     * @param {string} filename
     */
    download: function (buffer, filename) {
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    },

    /**
     * Build a watertight lithophane geometry from a heightmap pixel array.
     * @param {Uint8ClampedArray} pixels - RGBA pixel data
     * @param {number} imgW - image width
     * @param {number} imgH - image height
     * @param {object} opts - { gridW, gridH, baseThick, maxThick, brightness, contrast, invert, geometry }
     * @returns {THREE.BufferGeometry}
     */
    buildLithophaneGeometry: function (pixels, imgW, imgH, opts) {
        const {
            gridW = 100,
            gridH = 100,
            baseThick = 0.8,
            maxThick = 3.2,
            brightness = 0.5,
            contrast = 0.8,
            invert = false,
            geomType = 'flat'
        } = opts;

        const thickRange = maxThick - baseThick;
        const scaleX = 80; // mm width
        const scaleY = 80; // mm height

        // Compute height for each grid vertex
        const heights = new Float32Array((gridW + 1) * (gridH + 1));
        for (let row = 0; row <= gridH; row++) {
            for (let col = 0; col <= gridW; col++) {
                // Sample pixel from image
                const px = Math.min(Math.floor((col / gridW) * imgW), imgW - 1);
                const py = Math.min(Math.floor((row / gridH) * imgH), imgH - 1);
                const idx = (py * imgW + px) * 4;
                // Grayscale
                let g = (pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114) / 255;
                // Apply brightness/contrast
                g = (g - 0.5) * contrast + 0.5 + (brightness - 0.5);
                g = Math.max(0, Math.min(1, g));
                if (invert) g = 1 - g;
                heights[row * (gridW + 1) + col] = baseThick + g * thickRange;
            }
        }

        // Build geometry positions for front face, back face, and sides
        const positions = [];
        const normals = [];

        const getPos = (col, row, z) => {
            const x = (col / gridW - 0.5) * scaleX;
            const y = (0.5 - row / gridH) * scaleY;
            if (geomType === 'cylindrical') {
                const angle = (col / gridW - 0.5) * Math.PI * 0.6;
                const radius = scaleX / (Math.PI * 0.6);
                return [Math.sin(angle) * (radius + z), y, Math.cos(angle) * (radius + z) - radius];
            } else if (geomType === 'curved') {
                const cx = (col / gridW - 0.5);
                const cy = (row / gridH - 0.5);
                const curve = (1 - (cx * cx + cy * cy)) * 4;
                return [x, y, z + curve];
            }
            return [x, y, z];
        };

        const addTri = (ax, ay, az, bx, by, bz, cx, cy, cz) => {
            // Compute normal
            const ux = bx - ax, uy = by - ay, uz = bz - az;
            const vx = cx - ax, vy = cy - ay, vz = cz - az;
            let nx = uy * vz - uz * vy;
            let ny = uz * vx - ux * vz;
            let nz = ux * vy - uy * vx;
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
            nx /= len; ny /= len; nz /= len;
            positions.push(ax, ay, az, bx, by, bz, cx, cy, cz);
            normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
        };

        // Front face (heightmap surface)
        for (let row = 0; row < gridH; row++) {
            for (let col = 0; col < gridW; col++) {
                const h00 = heights[row * (gridW + 1) + col];
                const h10 = heights[row * (gridW + 1) + col + 1];
                const h01 = heights[(row + 1) * (gridW + 1) + col];
                const h11 = heights[(row + 1) * (gridW + 1) + col + 1];
                const [x00, y00, z00] = getPos(col, row, h00);
                const [x10, y10, z10] = getPos(col + 1, row, h10);
                const [x01, y01, z01] = getPos(col, row + 1, h01);
                const [x11, y11, z11] = getPos(col + 1, row + 1, h11);
                addTri(x00, y00, z00, x10, y10, z10, x11, y11, z11);
                addTri(x00, y00, z00, x11, y11, z11, x01, y01, z01);
            }
        }

        // Back face (flat, z=0)
        for (let row = 0; row < gridH; row++) {
            for (let col = 0; col < gridW; col++) {
                const [x00, y00, z00] = getPos(col, row, 0);
                const [x10, y10, z10] = getPos(col + 1, row, 0);
                const [x01, y01, z01] = getPos(col, row + 1, 0);
                const [x11, y11, z11] = getPos(col + 1, row + 1, 0);
                // Reversed winding for back face
                addTri(x00, y00, z00, x11, y11, z11, x10, y10, z10);
                addTri(x00, y00, z00, x01, y01, z01, x11, y11, z11);
            }
        }

        // Side walls
        const addSideQuad = (a, b, c, d) => {
            addTri(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
            addTri(a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]);
        };

        // Top edge (row=0)
        for (let col = 0; col < gridW; col++) {
            addSideQuad(
                getPos(col, 0, 0),
                getPos(col + 1, 0, 0),
                getPos(col + 1, 0, heights[0 * (gridW + 1) + col + 1]),
                getPos(col, 0, heights[0 * (gridW + 1) + col])
            );
        }
        // Bottom edge (row=gridH)
        for (let col = 0; col < gridW; col++) {
            addSideQuad(
                getPos(col + 1, gridH, 0),
                getPos(col, gridH, 0),
                getPos(col, gridH, heights[gridH * (gridW + 1) + col]),
                getPos(col + 1, gridH, heights[gridH * (gridW + 1) + col + 1])
            );
        }
        // Left edge (col=0)
        for (let row = 0; row < gridH; row++) {
            addSideQuad(
                getPos(0, row + 1, 0),
                getPos(0, row, 0),
                getPos(0, row, heights[row * (gridW + 1) + 0]),
                getPos(0, row + 1, heights[(row + 1) * (gridW + 1) + 0])
            );
        }
        // Right edge (col=gridW)
        for (let row = 0; row < gridH; row++) {
            addSideQuad(
                getPos(gridW, row, 0),
                getPos(gridW, row + 1, 0),
                getPos(gridW, row + 1, heights[(row + 1) * (gridW + 1) + gridW]),
                getPos(gridW, row, heights[row * (gridW + 1) + gridW])
            );
        }

        const floatPositions = new Float32Array(positions);
        const floatNormals = new Float32Array(normals);

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(floatPositions, 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(floatNormals, 3));
        return geo;
    }
};
