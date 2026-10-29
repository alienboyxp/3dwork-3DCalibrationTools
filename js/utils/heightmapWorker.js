// =====================================================
// heightmapWorker.js
// Note: Web Workers require same-origin or data URI.
// In this CDN/file-based setup, heightmap generation
// runs inline (see stlExporter.js).
// This file is a documented placeholder.
// =====================================================

// For production deployment, move buildLithophaneGeometry()
// into a Web Worker like this:
//
//   self.onmessage = function(e) {
//     const { pixels, imgW, imgH, opts } = e.data;
//     const geo = buildLithophaneGeometry(pixels, imgW, imgH, opts);
//     // ... transfer typed arrays back
//     self.postMessage({ positions, normals });
//   };
//
// Then in the component:
//   const worker = new Worker('./js/utils/heightmapWorker.js');
//   worker.postMessage({ pixels, imgW, imgH, opts });
//   worker.onmessage = (e) => { /* rebuild geometry from e.data */ };
