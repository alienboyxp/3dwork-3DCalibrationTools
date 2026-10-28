import * as THREE from 'three';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';
import helvetikerRegular from 'three/examples/fonts/helvetiker_regular.typeface.json';
import helvetikerBold from 'three/examples/fonts/helvetiker_bold.typeface.json';
import type { RegionSet, Ring, RGB } from '../types';

const fontLoader = new FontLoader();
const ttfLoader = new TTFLoader();

export interface FontOption {
  id: string;
  name: string;
  font: Font;
  imported?: boolean;
}

export const FONT_OPTIONS: FontOption[] = [];

const BUILT_IN_FONTS: [string, string, any][] = [
  ['helvetiker-regular', 'Standard', helvetikerRegular],
  ['helvetiker-bold', 'Standard Bold', helvetikerBold],
];

for (const [id, name, data] of BUILT_IN_FONTS) {
  FONT_OPTIONS.push({ id, name, font: fontLoader.parse(data) });
}

const BUNDLED_TTF = [
  ['bebas-neue', 'Bebas Neue'],
  ['anton', 'Anton'],
  ['oswald', 'Oswald'],
  ['titillium-web', 'Titillium Web'],
  ['rajdhani', 'Rajdhani'],
  ['chakra-petch', 'Chakra Petch'],
  ['orbitron', 'Orbitron'],
  ['audiowide', 'Audiowide'],
  ['michroma', 'Michroma'],
  ['russo-one', 'Russo One'],
  ['righteous', 'Righteous'],
  ['bungee', 'Bungee'],
  ['share-tech-mono', 'Share Tech Mono'],
  ['vt323', 'VT323'],
  ['press-start-2p', 'Press Start 2P'],
  ['arvo', 'Arvo'],
  ['lobster', 'Lobster'],
  ['pacifico', 'Pacifico'],
  ['bangers', 'Bangers'],
  ['creepster', 'Creepster'],
  ['permanent-marker', 'Permanent Marker'],
  ['sigmar-one', 'Sigmar One'],
  ['luckiest-guy', 'Luckiest Guy'],
  ['bungee-shade', 'Bungee Shade'],
  ['dancing-script', 'Dancing Script'],
  ['amatic-sc', 'Amatic SC'],
  ['playfair-display', 'Playfair Display'],
  ['kalam', 'Kalam']
];

let bundledLoaded = false;
export async function loadBundledFonts(onLoaded?: (option: FontOption) => void) {
  if (bundledLoaded) return;
  bundledLoaded = true;
  const baseUrl = import.meta.env.BASE_URL || '/';

  // Inject @font-face rules so we can preview the fonts in the UI
  const fontFaceStyles = BUNDLED_TTF.map(([slug]) => `
    @font-face {
      font-family: '${slug}';
      src: url('${baseUrl}fonts/${slug}.ttf') format('truetype');
    }
  `).join('\n');
  const styleEl = document.createElement('style');
  styleEl.textContent = fontFaceStyles;
  document.head.appendChild(styleEl);

  for (const [slug, name] of BUNDLED_TTF) {
    try {
      const buf = await fetch(`${baseUrl}fonts/${slug}.ttf`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.arrayBuffer();
      });
      const parsedTTF = ttfLoader.parse(buf);
      const font = fontLoader.parse(parsedTTF);
      const option = { id: `bundled-${slug}`, name, font };
      FONT_OPTIONS.push(option);
      onLoaded?.(option);
    } catch (e: any) {
      console.warn(`Could not load font "${name}":`, e.message);
    }
  }
}

function uniqueFontId(base: string): string {
  const slug = base
    .replace(/\.[^.]+$/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'imported-font';
  let id = `imported-${slug}`;
  let suffix = 2;
  while (FONT_OPTIONS.some((font) => font.id === id)) {
    id = `imported-${slug}-${suffix}`;
    suffix++;
  }
  return id;
}

function fontNameFromData(data: any, fallback: string): string {
  return data.familyName || data.original_font_information?.fullName?.en || fallback;
}

export async function importFontFile(file: File): Promise<FontOption> {
  const isJson = /\.json$/i.test(file.name);
  const data = isJson
    ? JSON.parse(await file.text())
    : ttfLoader.parse(await file.arrayBuffer());
  const option = {
    id: uniqueFontId(file.name),
    name: fontNameFromData(data, file.name.replace(/\.[^.]+$/g, '')),
    font: fontLoader.parse(data),
    imported: true,
  };
  FONT_OPTIONS.push(option);
  return option;
}

/**
 * Build a RegionSet from text.
 * @param separate  When false (default) every letter is merged into one element so the
 *   whole word selects/recolors/extrudes together. When true each glyph becomes its own
 *   region (part `top-color-{k}-0`), so letters can be picked and colored individually.
 */
/**
 * Build a RegionSet from text.
 * @param separate  When false (default) every letter is merged into one element so the
 *   whole word selects/recolors/extrudes together. When true each glyph becomes its own
 *   region (part `top-color-{k}-0`), so letters can be picked and colored individually.
 * @param spacing  Extra letter spacing (normalized units, added between glyphs) and
 *   line spacing multiplier (1 = default 130-unit line gap). Mirrors the live generator.
 */
export function parseLetter(
  text: string,
  fontId: string,
  maxLen = 30,
  separate = false,
  spacing: { letterSpacing?: number; lineSpacing?: number } = {},
): RegionSet {
  if (!text.trim()) throw new Error('Type a letter first.');

  const option = FONT_OPTIONS.find((font) => font.id === fontId) || FONT_OPTIONS[0];
  // Each glyph is a group of rings (its outline + any holes), kept grouped so we can
  // either merge them all into one element or expose each letter on its own.
  const glyphs: Ring[][] = [];
  const box = new THREE.Box2(
    new THREE.Vector2(Infinity, Infinity),
    new THREE.Vector2(-Infinity, -Infinity)
  );

  const lines = text.split('\n');
  let currentY = 0;
  const letterSpacingUnits = (spacing.letterSpacing ?? 0) * 100; // normalized → font units
  const lineGap = 130 * (spacing.lineSpacing ?? 1);

  for (const rawLine of lines) {
    const chars = Array.from((rawLine || '').trim()).slice(0, maxLen);
    if (!chars.length) continue;

    const lineGlyphs: { rings: Ring[]; advanceX: number }[] = [];

    // Generate each glyph individually so letterSpacing can shift them apart.
    let xCursor = 0;
    let lastAdvance = 0;
    for (const ch of chars) {
      if (ch === ' ') { xCursor += 34 + letterSpacingUnits; continue; }
      const shapes = option.font.generateShapes(ch, 100);
      const glyphRings: Ring[] = [];
      let gMinX = Infinity, gMaxX = -Infinity;
      for (const shape of shapes) {
        const extracted = shape.extractPoints(16);
        if (extracted.shape.length >= 3) {
          const ring: Ring = [];
          for (const p of extracted.shape) {
            if (p.x < gMinX) gMinX = p.x;
            if (p.x > gMaxX) gMaxX = p.x;
            ring.push([p.x, p.y]);
          }
          glyphRings.push(ring);
        }
        for (const hole of extracted.holes) {
          if (hole.length >= 3) {
            const ring: Ring = [];
            for (const p of hole) ring.push([p.x, p.y]);
            glyphRings.push(ring);
          }
        }
      }
      if (glyphRings.length) {
        // Horizontal advance: glyph width + side bearings from the font data.
        const cp = ch.codePointAt(0) ?? 0;
        const glyphData = (option.font as any).data?.glyphs?.[ch] ?? (option.font as any).data?.glyphs?.[cp];
        const advance = glyphData?.ha ?? Math.max(gMaxX - gMinX, 20);
        lineGlyphs.push({ rings: glyphRings, advanceX: xCursor });
        lastAdvance = advance;
        xCursor += advance + letterSpacingUnits;
      }
    }

    if (lineGlyphs.length === 0) continue;

    const lineWidth = xCursor - lastAdvance; // total advance of the line
    const offsetX = -lineWidth / 2;

    for (const g of lineGlyphs) {
      for (const ring of g.rings) {
        for (const pt of ring) {
          pt[0] += offsetX + g.advanceX;
          pt[1] += currentY;
          box.expandByPoint(new THREE.Vector2(pt[0], pt[1]));
        }
      }
      glyphs.push(g.rings);
    }

    currentY -= lineGap; // Move down for the next line
  }

  if (!glyphs.length) throw new Error('No drawable outlines found in this font.');

  const cx = (box.min.x + box.max.x) / 2;
  const cy = (box.min.y + box.max.y) / 2;
  const dx = box.max.x - box.min.x;
  const dy = box.max.y - box.min.y;
  const maxSide = Math.max(dx, dy) || 1;
  const aspect = dy !== 0 ? dx / dy : 1;

  const normalizeRing = (r: Ring): Ring =>
    r.map(([x, y]) => [
      (x - cx) / maxSide,
      (y - cy) / maxSide // keep Y-up
    ]);

  // Default text color is off-white (#f7f7f5)
  const OFFWHITE: RGB = [247, 247, 245];
  const outline = glyphs.flat().map(normalizeRing);

  const regions = separate
    ? glyphs.map((glyphRings) => ({
        quantRgb: OFFWHITE,
        components: [{ rings: glyphRings.map(normalizeRing), coverage: 1.0 }],
        coverage: 1.0,
      }))
    : [{
        quantRgb: OFFWHITE,
        components: [{ rings: outline, coverage: 1.0 }],
        coverage: 1.0,
      }];

  return { regions, outline, aspect };
}
