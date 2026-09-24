import assert from 'node:assert/strict';
import { Hct, SchemeTonalSpot, TonalPalette, argbFromHex, hexFromArgb, themeFromSourceColor } from '@material/material-color-utilities';
import { FALLBACKS, nothingWidgetColors, paletteFromSeed, TOKENS, withLstar } from './index.js';

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

// A palette read off a device is used as-is.
{
  const device = structuredClone(paletteFromSeed('#2e7d32'));
  device.neutral1[50] = '#fafafa';
  device.neutral1[900] = '#111111';
  device.neutral1[10] = '#0a0a0a';
  assert.equal(nothingWidgetColors(device, 'light').widgetBg, '#fafafa');
  assert.equal(nothingWidgetColors(device, 'dark').widgetBg, '#111111');
  assert.equal(nothingWidgetColors(device, 'dark').mediaPageIndicatorSelected, '#0a0a0a');
  assert.equal(nothingWidgetColors(device, 'light').widgetElements, '#000000', 'static survives palette');
  // Resolved data wins over a stray `source` field.
  assert.equal(nothingWidgetColors({ ...device, source: 5 }, 'light').widgetBg, '#fafafa');
}

// An incomplete palette fails with the missing shades instead of mixing in fallbacks.
assert.throws(() => nothingWidgetColors({ neutral1: { 50: '#fafafa' } }, 'light'), /accent1_600/);
// Tone keys (95, 10...) instead of shade keys (50, 900...) are a likely mix-up.
assert.throws(() => nothingWidgetColors({ neutral1: { 95: '#fafafa' } }, 'light'), /not tones/);
{
  const device = structuredClone(paletteFromSeed('#2e7d32'));
  // Colors in the forms Android hands out are accepted and come back as #rrggbb.
  device.neutral1[900] = 0xff111111;
  assert.equal(nothingWidgetColors(device, 'dark').widgetBg, '#111111', 'ARGB int');
  device.neutral1[900] = '#FF222222';
  assert.equal(nothingWidgetColors(device, 'dark').widgetBg, '#222222', '#AARRGGBB');
  device.neutral1[900] = '333333';
  assert.equal(nothingWidgetColors(device, 'dark').widgetBg, '#333333', 'no #');
  device.neutral1[900] = 'red';
  assert.throws(() => nothingWidgetColors(device, 'dark'), /neutral1_900/);
  device.neutral1[900] = '#12345';
  assert.throws(() => nothingWidgetColors(device, 'dark'), /neutral1_900/);
}

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
// Android ignores an lStar outside 0-100 and keeps the color.
assert.equal(withLstar('#3c4758', 150), '#3c4758');
assert.equal(withLstar('#3c4758', -5), '#3c4758');
assert.throws(() => withLstar('red', 50), TypeError);
// A string or null must not be coerced into a number (null >= 0 is true).
assert.throws(() => withLstar('#3c4758', '12'), TypeError);
assert.throws(() => withLstar('#3c4758', null), TypeError);
assert.equal(withLstar('#3c4758', NaN), '#3c4758');

// A Theme from themeFromSourceColor is rebuilt from theme.source, so it lands on
// the same colors as the seed, grey-seed fallback included (the Theme's own
// palettes use Android 12's chromas and skip that fallback).
for (const seed of ['#d71921', '#888888']) {
  for (const mode of ['light', 'dark']) {
    const theme = themeFromSourceColor(argbFromHex(seed));
    assert.deepEqual(
      nothingWidgetColors(theme, mode),
      nothingWidgetColors(seed, mode),
      `theme and seed agree (${mode}, seed ${seed})`);
  }
}

// A Theme's bare palettes object carries no seed and Android 12's chromas, so it's refused.
assert.throws(() => nothingWidgetColors(themeFromSourceColor(argbFromHex('#d71921')).palettes, 'light'), /unrecognized palette/);

// Repeated calls reuse the cached palette but still return fresh objects.
{
  const first = nothingWidgetColors('#2e7d32', 'light');
  first.widgetBg = 'changed';
  assert.notEqual(nothingWidgetColors('#2e7d32', 'light').widgetBg, 'changed');
  assert.equal(nothingWidgetColors('#2e7d32', 'dark').widgetBg, paletteFromSeed('#2e7d32').neutral1[900]);
}

// ARGB numbers are what sourceColorFromImage and theme.source hand back.
assert.deepEqual(nothingWidgetColors(0xffd71921, 'light'), nothingWidgetColors('#d71921', 'light'));

// A DynamicScheme is rebuilt from its source color, grey-seed fallback included.
for (const seed of ['#d71921', '#888888']) {
  assert.deepEqual(
    nothingWidgetColors(new SchemeTonalSpot(Hct.fromInt(argbFromHex(seed)), true, 0), 'dark'),
    nothingWidgetColors(seed, 'dark'),
    `DynamicScheme from ${seed}`);
}

// Shared exports can't be changed by one consumer for everyone else.
assert.ok(Object.isFrozen(TOKENS.light.widgetBg.shade) && Object.isFrozen(FALLBACKS.neutral1));
assert.throws(() => { 'use strict'; TOKENS.light.widgetBg.shade[1] = 900; }, TypeError);

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
