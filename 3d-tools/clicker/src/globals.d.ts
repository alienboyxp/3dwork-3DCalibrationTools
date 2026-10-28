// Ambient declarations for globals used by the model mode.
declare global {
  interface Window {
    parseStl: (file: File) => Promise<import('./model/parsers').MeshData>;
    parseObj: (file: File) => Promise<import('./model/parsers').MeshData>;
    __modelMesh?: { vertProperties: Float32Array; triVerts: Uint32Array; numProp: number };
    __ce?: string[];
  }
}

export {};
