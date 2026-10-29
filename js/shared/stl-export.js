        /**
         * ========================================================================
         * 1. 3D ENGINES (STL & SHADERS)
         * ========================================================================
         */
        window.STLExporter = {
            download: (buf, name) => {
                const bl = new Blob([buf], { type: 'application/octet-stream' });
                const u = URL.createObjectURL(bl);
                const a = document.createElement('a'); a.href = u; a.download = name; a.click();
                setTimeout(() => URL.revokeObjectURL(u), 1000);
            },
            exportBinary: (geo) => {
                if (!geo) return null;
                const pos = geo.getAttribute('position'); const count = pos.count / 3;
                const b = new ArrayBuffer(84 + count * 50); const v = new DataView(b);
                const h = "3Dwork.io Export"; for (let i = 0; i < 80; i++) v.setUint8(i, i < h.length ? h.charCodeAt(i) : 0); v.setUint32(80, count, true);
                const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3(), cb = new THREE.Vector3(), ab = new THREE.Vector3();
                let off = 84;
                for (let i = 0; i < count; i++) {
                    vA.fromBufferAttribute(pos, i * 3); vB.fromBufferAttribute(pos, i * 3 + 1); vC.fromBufferAttribute(pos, i * 3 + 2);
                    cb.subVectors(vC, vB); ab.subVectors(vA, vB); cb.cross(ab).normalize();
                    v.setFloat32(off, cb.x, true); v.setFloat32(off + 4, cb.y, true); v.setFloat32(off + 8, cb.z, true);
                    v.setFloat32(off + 12, vA.x, true); v.setFloat32(off + 16, vA.y, true); v.setFloat32(off + 20, vA.z, true);
                    v.setFloat32(off + 24, vB.x, true); v.setFloat32(off + 28, vB.y, true); v.setFloat32(off + 32, vB.z, true);
                    v.setFloat32(off + 36, vC.x, true); v.setFloat32(off + 40, vC.y, true); v.setFloat32(off + 44, vC.z, true);
                    v.setUint16(off + 48, 0, true); off += 50;
                }
                return b;
            },
            // La geometría vive en js/utils/lithoGeometry.js (tiene tests:
            // estanqueidad de la malla, orientación, marco y cuantización).
            buildLitho: (pix, imgW, imgH, S) => {
                const built = window.LithoGeometry.build(pix, imgW, imgH, {
                    width: S.width, height: S.height, baseT: S.baseT, maxT: S.maxT,
                    bright: S.bright, contrast: S.contrast, invert: S.invert,
                    gamma: S.gamma, smoothing: S.smoothing, mirror: S.mirror,
                    res: S.res, layerHeight: S.layerHeight, geom: S.geom,
                    curveAngle: S.curveAngle, border: S.border,
                    scaleMode: S.scaleMode, upright: S.upright
                });
                const geo = new THREE.BufferGeometry();
                geo.setAttribute('position', new THREE.BufferAttribute(built.positions, 3));
                // Color por nivel de grosor: simula how much light passes
                const cols = new Float32Array(built.positions.length);
                for (let i = 0, v = 0; i < built.positions.length; i += 3, v++) {
                    // Panel de filamento blanco: lo más grueso queda un poco
                    // más apagado (absorbe más), el relieve lo da la luz.
                    const c = 1.0 - built.levels[v] * 0.38;
                    cols[i] = c; cols[i + 1] = c; cols[i + 2] = c;
                }
                geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
                geo.computeVertexNormals();
                geo.userData = { stats: built.stats, levels: built.levels };
                return geo;
            }
        };

        /**
         * Export 3MF de la litofanía CMYK (AMS): un objeto por placa con su
         * material y su extrusor asignado (1=white, 2=cyan, 3=magenta,
         * 4=yellow), siguiendo el patrón del export del HueForge (JSZip +
         * basematerials + model_settings.config con el extrusor por objeto).
         * @param {Array} plates - de window.LithoGeometry.buildCmyk()
         */
        window.exportCmyk3MF = async (plates) => {
            if (!plates || !plates.length) return;
            // Entidades XML construidas con \u0026 ("&"): un nombre con
            // caracteres especiales nunca rompe el atributo del 3MF.
            const esc = (s) => String(s).replace(/[<>&'"]/g, c => ({
                '<': '\u0026lt;', '>': '\u0026gt;', '\u0026': '\u0026amp;',
                "'": '\u0026apos;', '"': '\u0026quot;'
            }[c]));
            let model = '<?xml version="1.0" encoding="UTF-8"?>\n' +
                '<model unit="millimeter" xml:lang="en-US" ' +
                'xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" ' +
                'xmlns:slic3rpe="http://schemas.slic3r.org/3mf/2017/06">\n' +
                '<metadata name="Application">3Dwork Lithophane CMYK</metadata>\n' +
                '<resources>\n<basematerials id="0">\n';
            plates.forEach(p => {
                model += '<base name="' + esc(p.name) + '" displaycolor="' +
                    p.hex.replace('#', '').toUpperCase() + 'FF" />\n';
            });
            model += '</basematerials>\n';
            plates.forEach((p, i) => {
                const pos = p.positions;
                let v = '', t = '';
                for (let k = 0; k < pos.length; k += 3) {
                    v += '<vertex x="' + pos[k].toFixed(3) + '" y="' + pos[k + 1].toFixed(3) +
                        '" z="' + pos[k + 2].toFixed(3) + '" />\n';
                }
                const n = pos.length / 9;
                for (let k = 0; k < n; k++) {
                    const a = k * 3;
                    t += '<triangle v1="' + a + '" v2="' + (a + 1) + '" v3="' + (a + 2) + '" />\n';
                }
                model += '<object id="' + (i + 1) + '" type="model" pid="0" pindex="' + i + '">\n' +
                    '<mesh>\n<vertices>\n' + v + '</vertices>\n<triangles>\n' + t +
                    '</triangles>\n</mesh>\n</object>\n';
            });
            model += '</resources>\n<build>\n';
            plates.forEach((p, i) => { model += '<item objectid="' + (i + 1) + '" />\n'; });
            model += '</build>\n</model>';

            let cfg = '<?xml version="1.0" encoding="UTF-8"?>\n<config>\n';
            plates.forEach((p, i) => {
                cfg += '<object id="' + (i + 1) + '">\n' +
                    '<metadata key="extruder" value="' + p.extruder + '" />\n' +
                    '<metadata key="3dwork_cmyk_color" value="' + p.hex + '" />\n' +
                    '</object>\n';
            });
            cfg += '</config>';

            const files = {
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
            const zip = new JSZip();
            Object.keys(files).forEach(p => zip.file(p, files[p]));
            const blob = await zip.generateAsync({ type: 'blob' });
            const u = URL.createObjectURL(blob); const a = document.createElement('a');
            a.href = u; a.download = '3dwork_litho_cmyk.3mf'; a.click();
            setTimeout(() => URL.revokeObjectURL(u), 1000);
        };

        /**
         * Método lithophanemaker (sin AMS): las 4 placas como STLs en un
         * zip, cada una apoyada en la cama (se le resta su offset Z) para
         * imprimirlas por separado y apilarlas a mano.
         * @param {Array} plates - de window.LithoGeometry.buildCmyk()
         */
        window.exportCmykStlZip = async (plates) => {
            if (!plates || !plates.length) return;
            const zip = new JSZip();
            plates.forEach(p => {
                const pos = new Float32Array(p.positions);
                for (let i = 2; i < pos.length; i += 3) pos[i] -= p.zOffset;
                const g = new THREE.BufferGeometry();
                g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
                zip.file('litho_cmyk_' + p.name + '.stl', STLExporter.exportBinary(g));
            });
            zip.file('README.txt',
                '3Dwork.io/tools - Lithophane CMYK (4 plates)\n' +
                '===========================================\n\n' +
                'No-AMS method: print each plate separately and stack them\n' +
                'aligned (image facing the same way), backlit with a white LED.\n\n' +
                'Bottom to top (official Bambu colors):\n' +
                '  1. litho_cmyk_white.stl    #FFFFFF  white   - diffuser, modulates brightness\n' +
                '  2. litho_cmyk_cyan.stl     #0086D6  cyan    - blocks red\n' +
                '  3. litho_cmyk_magenta.stl  #EC008C  magenta - blocks green\n' +
                '  4. litho_cmyk_yellow.stl  #F4EE2A  yellow  - blocks blue\n\n' +
                'Each STL lies flat on the bed (image in XY, thickness in Z).\n' +
                '0.2 mm nozzle recommended, 0.08-0.12 mm layers, 100% infill.\n');
            const blob = await zip.generateAsync({ type: 'blob' });
            const u = URL.createObjectURL(blob); const a = document.createElement('a');
            a.href = u; a.download = '3dwork_litho_cmyk_stl.zip'; a.click();
            setTimeout(() => URL.revokeObjectURL(u), 1000);
        };
