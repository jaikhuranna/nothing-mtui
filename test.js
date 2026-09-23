import assert from 'node:assert/strict';
import { Hct, SchemeTonalSpot, TonalPalette, argbFromHex, hexFromArgb, themeFromSourceColor } from '@material/material-color-utilities';
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

assert.equal(light.widgetBg, '#eff0f7');
assert.equal(dark.widgetBg, '#191c20');
assert.equal(light.widgetElements, '#000000');
assert.equal(dark.widgetElements, '#ffffff');
assert.equal(light.widgetFood, '#d71921');
assert.equal(dark.widgetFood, '#d71921');
assert.equal(light.mediaPageIndicator, '#c5c6cc');
assert.equal(dark.mediaPageIndicatorSelected, '#fdfcff');
assert.equal(light.settingsTrackOff, '#5a5e66');
assert.equal(dark.settingsTrackOff, '#44474c');
assert.equal(dark.settingsTrackOn, '#3c4758');
assert.equal(light.settingsBg, '#eff0f7');
assert.equal(dark.settingsBg, '#1d2024', 'lStar=12 applied to neutral1_900');

// seed string generates the same palette object
assert.equal(nothingWidgetColors('#d71921', 'light').widgetBg, '#ffedea');
assert.deepEqual(
  nothingWidgetColors('#d71921', 'dark'),
  nothingWidgetColors(paletteFromSeed('#d71921'), 'dark'));

const palette = { neutral1: { 50: '#fafafa', 900: '#111111', 10: '#0a0a0a' } };
assert.equal(nothingWidgetColors(palette, 'light').widgetBg, '#fafafa');
assert.equal(nothingWidgetColors(palette, 'dark').widgetBg, '#111111');
assert.equal(nothingWidgetColors(palette, 'dark').mediaPageIndicatorSelected, '#0a0a0a');
assert.equal(nothingWidgetColors(palette, 'light').widgetElements, '#000000', 'static survives palette');

// Chromas Android 14-16 use for the system palette (SchemeTonalSpot, per
// frameworks/libs/systemui ColorScheme). Written out here rather than read from
// the library, so a wrong scheme in index.js can't pass by agreeing with itself.
const ANDROID_14_CHROMA = { neutral1: 6, neutral2: 8, accent1: 36, accent2: 16 };
for (const seed of ['#d71921', '#2e7d32', '#8a8f99', '#1b6ef3']) {
  const hue = Hct.fromInt(argbFromHex(seed)).hue;
  const palette = paletteFromSeed(seed);
  for (const [key, chroma] of Object.entries(ANDROID_14_CHROMA)) {
    const want = TonalPalette.fromHueAndChroma(hue, chroma);
    for (const shade of [0, 10, 50, 100, 500, 900, 1000]) {
      assert.equal(palette[key][shade], hexFromArgb(want.tone(100 - shade / 10)), `${seed} ${key}_${shade}`);
    }
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
  const viaBarePalettes = nothingWidgetColors(theme.palettes, 'light');
  assert.notEqual(viaBarePalettes.widgetBg, FALLBACKS.neutral1_50, 'bare palettes must not fall back to FALLBACKS');
  assert.deepEqual(viaBarePalettes, nothingWidgetColors(paletteFromTheme(theme.palettes), 'light'));
}

// ARGB numbers are what sourceColorFromImage and theme.source hand back.
assert.deepEqual(nothingWidgetColors(0xffd71921, 'light'), nothingWidgetColors('#d71921', 'light'));

// A DynamicScheme is used as-is, and SchemeTonalSpot is what Android 14+ builds.
assert.deepEqual(
  nothingWidgetColors(new SchemeTonalSpot(Hct.fromInt(argbFromHex('#d71921')), true, 0), 'dark'),
  nothingWidgetColors('#d71921', 'dark'));

// Anything unrecognized should fail loudly rather than quietly return grey fallbacks.
const scheme = themeFromSourceColor(argbFromHex('#d71921')).schemes.dark;
assert.throws(() => nothingWidgetColors(scheme, 'dark'), TypeError, 'a Scheme is not a palette');
assert.throws(() => nothingWidgetColors({ foo: 1 }, 'dark'), /unrecognized palette/);
assert.throws(() => nothingWidgetColors(true, 'dark'), TypeError);
for (const bad of ['red', '#ff000080', '#12345', '']) {
  assert.throws(() => nothingWidgetColors(bad, 'light'), TypeError, `bad seed ${bad}`);
}
assert.equal(nothingWidgetColors('#f00', 'light').widgetFood, '#d71921', 'short hex is accepted');

assert.throws(() => nothingWidgetColors(null, 'Dark'), /unknown mode/);
assert.throws(() => nothingWidgetColors(null, 'toString'), /unknown mode/);

console.log('ok');
