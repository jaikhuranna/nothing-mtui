// Writes scripts/mcu-2025.json: the TONAL_SPOT palettes material-color-utilities
// 0.4.0 builds with its 2025 spec, used by test.js as a reference for
// paletteFromSeed(seed, { spec: '2025' }).
//
// 0.4.0 leaves file extensions off its imports, so plain Node can't load it.
// Node 18 can, with a flag. From the repo root:
//   (mkdir -p /tmp/mcu && cd /tmp/mcu && npm i @material/material-color-utilities@0.4.0)
//   node18 --experimental-specifier-resolution=node scripts/make-mcu-2025-fixture.mjs /tmp/mcu
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const dir = process.argv[2];
if (!dir) throw new Error('usage: make-mcu-2025-fixture.mjs <folder with material-color-utilities@0.4.0 installed>');
const entry = createRequire(`${dir}/`).resolve('@material/material-color-utilities');
const { Hct, SchemeTonalSpot, argbFromHex, hexFromArgb } = await import(entry);

const SHADES = [0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
// Red, green, blue and blue-grey, plus two yellows (hue 105-125) for the tone-99 case.
const SEEDS = ['#d71921', '#2e7d32', '#1b6ef3', '#8a8f99', '#b5b000', '#d6d600'];

const out = { generatedBy: 'material-color-utilities@0.4.0 SchemeTonalSpot, spec 2025, platform phone', seeds: {} };
for (const seed of SEEDS) {
  const hue = Hct.fromInt(argbFromHex(seed)).hue;
  out.seeds[seed] = { hue: Math.round(hue * 10) / 10 };
  for (const mode of ['light', 'dark']) {
    const s = new SchemeTonalSpot(Hct.fromInt(argbFromHex(seed)), mode === 'dark', 0, '2025', 'phone');
    const palettes = { neutral1: s.neutralPalette, neutral2: s.neutralVariantPalette, accent1: s.primaryPalette, accent2: s.secondaryPalette };
    out.seeds[seed][mode] = Object.fromEntries(Object.entries(palettes).map(([key, p]) =>
      [key, Object.fromEntries(SHADES.map(n => [n, hexFromArgb(p.tone(100 - n / 10))]))]));
  }
}
writeFileSync(new URL('mcu-2025.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log('wrote scripts/mcu-2025.json:', Object.entries(out.seeds).map(([s, v]) => `${s} hue ${v.hue}`).join(', '));
