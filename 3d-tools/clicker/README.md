# 3Dwork Clicker Factory

Browser-based generator that turns an image into a print-ready **3MF** of a multicolor "clicker" — a 3D-printed pressable button built around a real **Cherry MX** mechanical switch. 100% client-side, no backend, no hosting cost.

## Inspiration

This tool is inspired by the [Vostok Labs Clicker Generator](https://github.com/vostoklabs/Clicker-Generator-OLD) (reference project). All geometry, image tracing, and multicolor 3MF export concepts derive from that work, adapted for the 3Dwork ecosystem.

## Features

- **Image → 3MF**: upload any image (PNG with transparency works best) and it's quantized into a color palette, traced into 2D regions, and built as a watertight multicolor cap + body around a real MX switch socket/stem.
- **Multiple import sources**: Image, SVG, 1700+ Lucide icons, or custom Text.
- **Plate size presets**: Mini / Normal / Max / Plus generic MX housing sizes (Creality-style ranges).
- **Multiple switches**: 1–3 MX switches, each independently positionable and rotatable.
- **Keychain loop**: add a keyring loop around the body edge.
- **Live recolor**: click any part on the 3D model to change its filament color (no rebuild needed).
- **Extrude & edges**: raise/lower color parts, fillet/chamfer edges.
- **Exploded / section view**: preview how parts fit together.
- **3MF export**: print-ready multicolor file for Bambu Studio, OrcaSlicer, PrusaSlicer.

## Run locally

```bash
cd 3d-tools/clicker
npm install
npm run dev      # http://localhost:5173/
npm run build    # static output -> dist/
npm run preview  # serve the production build
```

## Deploy

The `dist/` folder is static HTML/JS — serve it from any web host or GitHub Pages.

## License

CC BY-NC-ND 4.0 — personal use only. Commercial use requires a license.

## Attribution

Geometry kernel, image pipeline, and multicolor export adapted from [Vostok Labs Clicker Generator](https://github.com/vostoklabs/Clicker-Generator-OLD) with permission-inspired improvements. MX switch assets (socket/stem/switch 3MF) are included from the reference project.
