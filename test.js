import assert from 'node:assert/strict';
import { Hct, TonalPalette, argbFromHex, hexFromArgb, themeFromSourceColor } from '@material/material-color-utilities';
import { FALLBACKS, nothingWidgetColors, paletteFromSeed, paletteFromTheme, TOKENS, withLstar } from './index.js';

for (const mode of ['light', 'dark']) {
  const colors = nothingWidgetColors(null, mode);
  assert.equal(Object.keys(colors).length, Object.keys(TOKENS[mode]).length, `${mode} token count`);
  for (const [name, value] of Object.entries(colors)) {
    assert.equal(typeof value, 'string', `${mode}.${name} must resolve, got ${value}`);
  }
}

const light = nothingWidgetColors(null, 'light');
const dark = nothingWidgetColors(null, 'dark');

assert.equal(light.widgetBg, '#f1f0f4');
assert.equal(dark.widgetBg, '#1a1c1e');
assert.equal(light.widgetElements, '#000000');
assert.equal(dark.widgetElements, '#ffffff');
assert.equal(light.widgetFood, '#d71921');
assert.equal(dark.widgetFood, '#d71921');
assert.equal(light.mediaPageIndicator, '#c6c6ca');
assert.equal(dark.mediaPageIndicatorSelected, '#fdfcff');
assert.equal(light.settingsTrackOff, '#5a5e66');
assert.equal(dark.settingsTrackOff, '#46474a');
assert.equal(dark.settingsTrackOn, '#3c4758');
assert.equal(light.settingsBg, '#f1f0f4');
assert.equal(dark.settingsBg, '#1e2022', 'lStar=12 applied to neutral1_900');

// seed string generates the same palette object
assert.equal(nothingWidgetColors('#d71921', 'light').widgetBg, '#fbeeec');
assert.deepEqual(
  nothingWidgetColors('#d71921', 'dark'),
  nothingWidgetColors(paletteFromSeed('#d71921'), 'dark'));

const palette = { neutral1: { 50: '#fafafa', 900: '#111111', 10: '#0a0a0a' } };
assert.equal(nothingWidgetColors(palette, 'light').widgetBg, '#fafafa');
assert.equal(nothingWidgetColors(palette, 'dark').widgetBg, '#111111');
assert.equal(nothingWidgetColors(palette, 'dark').mediaPageIndicatorSelected, '#0a0a0a');
assert.equal(nothingWidgetColors(palette, 'light').widgetElements, '#000000', 'static survives palette');

// accent2 uses AOSP's fixed chroma 16, not the content-scheme chroma/3. A
// high-chroma seed is the only place the two formulas disagree.
{
  const seed = '#d71921';
  const hct = Hct.fromInt(argbFromHex(seed));
  assert.ok(hct.chroma / 3 > 16, 'seed must be chromatic enough to tell the formulas apart');
  const a2 = paletteFromSeed(seed).accent2;
  const want = TonalPalette.fromHueAndChroma(hct.hue, 16);
  for (const shade of [100, 500, 700]) {
    assert.equal(a2[shade], hexFromArgb(want.tone(100 - shade / 10)), `accent2_${shade} fixed chroma 16`);
  }
}

// A near-grey seed has no usable hue, so AOSP substitutes a fixed blue.
assert.ok(Hct.fromInt(argbFromHex('#888888')).chroma < 5, 'grey seed is below the chroma cutoff');
assert.deepEqual(paletteFromSeed('#888888'), paletteFromSeed('#1b6ef3'), 'low-chroma seed falls back to blue');
assert.notDeepEqual(paletteFromSeed('#d71921'), paletteFromSeed('#1b6ef3'), 'chromatic seed is kept');

// Android defines shades 0 and 1000; they must resolve, not come back undefined.
for (const key of ['neutral1', 'neutral2', 'accent1', 'accent2']) {
  for (const shade of [0, 1000]) {
    assert.match(paletteFromSeed('#d71921')[key][shade], /^#[0-9a-f]{6}$/, `${key}_${shade}`);
  }
}

// lStar of 0 is a legal value and must not be skipped by a truthiness test.
assert.equal(withLstar('#3c4758', 0), '#000000', 'lStar 0 maps to black');

// A Material You Theme is the shape people actually get from the upstream
// package, and must land on the same colors as passing the seed directly —
// including on a near-grey seed, where the Theme's own palettes were built
// without the low-chroma fallback and paletteFromTheme must recover it via
// theme.source rather than trusting theme.palettes as-is.
for (const seed of ['#d71921', '#888888']) {
  for (const mode of ['light', 'dark']) {
    const theme = themeFromSourceColor(argbFromHex(seed));
    assert.deepEqual(
      nothingWidgetColors(theme, mode),
      nothingWidgetColors(seed, mode),
      `theme and seed agree (${mode}, seed ${seed})`);
  }
}

// The bare palettes sub-object (no .source) must still be recognized as
// Material-shaped and resolved through paletteFromTheme, not silently
// mistaken for an already-resolved { neutral1: {...} } palette and fall
// through to generic FALLBACKS.
{
  const theme = themeFromSourceColor(argbFromHex('#d71921'));
  const viaTheme = nothingWidgetColors(theme, 'light');
  const viaBarePalettes = nothingWidgetColors(theme.palettes, 'light');
  assert.notEqual(viaBarePalettes.widgetBg, FALLBACKS.neutral1_50, 'bare palettes must not fall back to FALLBACKS');
  assert.deepEqual(viaBarePalettes, nothingWidgetColors(paletteFromTheme(theme.palettes), 'light'));
}

assert.throws(() => nothingWidgetColors(null, 'Dark'), /unknown mode/);

console.log('ok');
