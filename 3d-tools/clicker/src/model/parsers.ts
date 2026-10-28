// Mesh parsers for the model mode: read an STL / OBJ file into a plain
// triangle soup (Float32 xyz vertices + Uint32 triangle indices) that the
// geometry worker can turn into a Manifold solid. 3MF goes through the
// existing parse3MF in geometry/threemfImport.ts.
export interface MeshData {
  vertProperties: Float32Array; // flat xyz
  triVerts: Uint32Array;        // 3 indices per triangle
  numProp: 3;
}

/** Parse an STL file (binary or ASCII) into a triangle soup. */
export async function parseStl(file: File): Promise<MeshData> {
  const buf = await file.arrayBuffer();
  // Heuristic: binary STL starts with "solid" too, so trust the length math.
  const u8 = new Uint8Array(buf);
  const isBinary = (() => {
    if (buf.byteLength < 84) return false;
    const dv = new DataView(buf);
    const triCount = dv.getUint32(80, true);
    return 84 + triCount * 50 === buf.byteLength;
  })();

  if (isBinary) {
    const dv = new DataView(buf);
    const triCount = dv.getUint32(80, true);
    const vertProperties = new Float32Array(triCount * 9);
    const triVerts = new Uint32Array(triCount * 3);
    let v = 0;
    for (let t = 0; t < triCount; t++) {
      const base = 84 + t * 50;
      for (let i = 0; i < 9; i++) vertProperties[v + i] = dv.getFloat32(base + 12 + i * 4, true);
      triVerts[t * 3] = t * 3;
      triVerts[t * 3 + 1] = t * 3 + 1;
      triVerts[t * 3 + 2] = t * 3 + 2;
      v += 9;
    }
    return { vertProperties, triVerts, numProp: 3 };
  }

  // ASCII STL: "vertex x y z" lines, every 3 make a facet.
  const text = new TextDecoder().decode(u8);
  const nums: number[] = [];
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (t.startsWith('vertex')) {
      const p = t.split(/\s+/).slice(1).map(Number);
      if (p.length >= 3) nums.push(p[0], p[1], p[2]);
    }
  }
  const triCount = Math.floor(nums.length / 9);
  const vertProperties = new Float32Array(nums.slice(0, triCount * 9));
  const triVerts = new Uint32Array(triCount * 3);
  for (let t = 0; t < triCount; t++) {
    triVerts[t * 3] = t * 3;
    triVerts[t * 3 + 1] = t * 3 + 1;
    triVerts[t * 3 + 2] = t * 3 + 2;
  }
  if (triCount === 0) throw new Error('No triangles found in STL');
  return { vertProperties, triVerts, numProp: 3 };
}

/** Parse an OBJ file (triangles only; the common case for printable exports). */
export async function parseObj(file: File): Promise<MeshData> {
  const text = await file.text();
  const verts: number[] = [];
  const idx: number[] = [];
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (t.startsWith('v ')) {
      const p = t.split(/\s+/).slice(1).map(Number);
      if (p.length >= 3) verts.push(p[0], p[1], p[2]);
    } else if (t.startsWith('f ')) {
      const f = t.split(/\s+/).slice(1);
      const ids = f.map((p) => parseInt(p.split('/')[0], 10));
      // Fan-triangulate polygons (flat shading OK for slicing purposes).
      for (let i = 1; i + 1 < ids.length; i++) {
        idx.push(ids[0] - 1, ids[i] - 1, ids[i + 1] - 1);
      }
    }
  }
  if (!idx.length) throw new Error('No faces found in OBJ');
  const vertProperties = new Float32Array(verts);
  const triVerts = new Uint32Array(idx);
  return { vertProperties, triVerts, numProp: 3 };
}
