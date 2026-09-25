import assert from 'node:assert/strict';
import { Hct, SchemeTonalSpot, TonalPalette, argbFromHex, hexFromArgb, themeFromSourceColor } from '@material/material-color-utilities';
import { readFileSync } from 'node:fs';
import { FALLBACK_SEED, nothingWidgetColors, paletteFromSeed, TOKENS, withLstar } from './index.js';

for (const mode of ['light', 'dark']) {
  const colors = nothingWidgetColors(null, mode);
  assert.equal(Object.keys(colors).length, Object.keys(TOKENS[mode]).length, `${mode} token count`);
  for (const [name, value] of Object.entries(colors)) {
    assert.equal(typeof value, 'string', `${mode}.${name} must resolve, got ${value}`);
  }
}

// Pinned values for the 2021 spec (Android 14 to 16 QPR0).
const light = nothingWidgetColors(null, 'light', { spec: '2021' });
const dark = nothingWidgetColors(null, 'dark', { spec: '2021' });

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
assert.equal(nothingWidgetColors('#d71921', 'light', { spec: '2021' }).widgetBg, '#ffedea');
assert.equal(nothingWidgetColors('#d71921', 'light').widgetBg, '#fdedeb', '2025 is the default');
// A palette built for a mode gives the same colors as the seed in that mode,
// and is refused in the other mode (2025 accent1 differs between them).
for (const seed of ['#d71921', '#2e7d32', '#b5b000']) {
  for (const mode of ['light', 'dark']) {
    assert.deepEqual(nothingWidgetColors(paletteFromSeed(seed, { mode }), mode), nothingWidgetColors(seed, mode), `${seed} ${mode}`);
  }
  assert.throws(() => nothingWidgetColors(paletteFromSeed(seed), 'dark'), /built for light mode/);
}
assert.notEqual(
  nothingWidgetColors('#2e7d32', 'dark').settingsAccent,
  paletteFromSeed('#2e7d32').accent1[100],
  'this seed is one where a light palette would give wrong dark accents');

// A palette read off a device is used as-is.
{
  const { mode: _m1, ...device } = structuredClone(paletteFromSeed('#2e7d32'));
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
assert.throws(() => nothingWidgetColors({ neutral1: { 95: '#fafafa' } }, 'light'), /missing .*not tones/);
{
  const { mode: _m2, ...device } = structuredClone(paletteFromSeed('#2e7d32'));
  // Colors in the forms Android hands out are accepted and come back as #rrggbb.
  device.neutral1[900] = 0xff111111;
  assert.equal(nothingWidgetColors(device, 'dark').widgetBg, '#111111', 'ARGB int');
  device.neutral1[900] = -15658735; // 0xff111111 as Android's signed Color int
  assert.equal(nothingWidgetColors(device, 'dark').widgetBg, '#111111', 'signed ARGB int');
  device.neutral1[900] = '#ABCDEF';
  assert.equal(nothingWidgetColors(device, 'dark').widgetBg, '#abcdef', 'upper case');
  // 8 digits could be #AARRGGBB (Android) or #RRGGBBAA (CSS), so neither is guessed.
  device.neutral1[900] = '#ff222222';
  assert.throws(() => nothingWidgetColors(device, 'dark'), /'#rrggbb' or an ARGB int: neutral1_900/);
  device.neutral1[900] = 2 ** 33;
  assert.throws(() => nothingWidgetColors(device, 'dark'), /neutral1_900/, 'out of 32-bit range');
  device.neutral1[900] = '333333';
  assert.equal(nothingWidgetColors(device, 'dark').widgetBg, '#333333', 'no #');
  device.neutral1[900] = 'red';
  assert.throws(() => nothingWidgetColors(device, 'dark'), /neutral1_900/);
  device.neutral1[900] = '#12345';
  assert.throws(() => nothingWidgetColors(device, 'dark'), /neutral1_900/);
}

// Chromas Android uses for the wallpaper palette, written out from AOSP rather
// than read from index.js, so a wrong scheme there can't pass by agreeing with itself.
const CHROMA = {
  2021: { light: { neutral1: 6, neutral2: 8, accent1: 36, accent2: 16 } },
  2025: {
    light: { neutral1: 5, neutral2: 8.5, accent1: 32, accent2: 16 },
    dark: { neutral1: 5, neutral2: 8.5, accent1: 26, accent2: 16 },
  },
};
CHROMA[2021].dark = CHROMA[2021].light;
for (const [spec, byMode] of Object.entries(CHROMA)) {
  for (const [mode, chromas] of Object.entries(byMode)) {
    for (const seed of ['#d71921', '#2e7d32', '#8a8f99', '#1b6ef3']) {
      const hue = Hct.fromInt(argbFromHex(seed)).hue;
      const palette = paletteFromSeed(seed, { spec, mode });
      for (const [key, chroma] of Object.entries(chromas)) {
        const want = TonalPalette.fromHueAndChroma(hue, chroma);
        for (const shade of [0, 10, 50, 100, 500, 900, 1000]) {
          assert.equal(palette[key][shade], hexFromArgb(want.tone(100 - shade / 10)), `${spec} ${mode} ${seed} ${key}_${shade}`);
        }
      }
    }
  }
}

// The 2025 spec against material-color-utilities 0.4.0's own output, every shade,
// including the tone-99 special case for yellow hues (see scripts/make-mcu-2025-fixture.mjs).
{
  const fixture = JSON.parse(readFileSync(new URL('./scripts/mcu-2025.json', import.meta.url), 'utf8'));
  for (const [seed, byMode] of Object.entries(fixture.seeds)) {
    for (const mode of ['light', 'dark']) {
      assert.deepEqual(paletteFromSeed(seed, { spec: '2025', mode }), { spec: '2025', mode, ...byMode[mode] }, `${seed} ${mode}`);
    }
  }
}

// In the 2025 spec only accent1 changes with the mode.
{
  const [l, d] = ['light', 'dark'].map(mode => paletteFromSeed('#d71921', { mode }));
  assert.notDeepEqual(l.accent1, d.accent1);
  assert.deepEqual([l.neutral1, l.neutral2, l.accent2], [d.neutral1, d.neutral2, d.accent2]);
  const { mode: _d, ...dark2021 } = paletteFromSeed('#d71921', { spec: '2021', mode: 'dark' });
  const { mode: _l, ...light2021 } = paletteFromSeed('#d71921', { spec: '2021' });
  assert.deepEqual(dark2021, light2021, 'the 2021 spec has one palette for both modes');
}

assert.throws(() => nothingWidgetColors('#d71921', 'light', { spec: '2024' }), /unknown spec/);
assert.throws(() => paletteFromSeed('#d71921', { mode: 'Dark' }), TypeError);
// A null options object means the defaults, as React Native callers often forward one.
assert.deepEqual(nothingWidgetColors('#d71921', 'dark', null), nothingWidgetColors('#d71921', 'dark'));
assert.deepEqual(paletteFromSeed('#d71921', null), paletteFromSeed('#d71921'));

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
assert.equal(withLstar('#F00', 150), '#ff0000', '#rgb is accepted and normalized');
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
  assert.equal(nothingWidgetColors('#2e7d32', 'dark').widgetBg, paletteFromSeed('#2e7d32', { mode: 'dark' }).neutral1[900]);
  assert.equal(nothingWidgetColors('#2e7d32', 'dark').settingsAccent, paletteFromSeed('#2e7d32', { mode: 'dark' }).accent1[100]);
}

// ARGB numbers are what sourceColorFromImage and theme.source hand back.
assert.deepEqual(nothingWidgetColors(0xffd71921, 'light'), nothingWidgetColors('#d71921', 'light'));
assert.deepEqual(nothingWidgetColors(0xffd71921 | 0, 'light'), nothingWidgetColors('#d71921', 'light'), 'signed int');
assert.throws(() => nothingWidgetColors(2 ** 33 + 0xd71921, 'light'), TypeError, 'out of 32-bit range');
assert.deepEqual(nothingWidgetColors(undefined, 'light'), nothingWidgetColors(null, 'light'), 'undefined means the fallback seed');
assert.deepEqual(nothingWidgetColors(null, 'dark'), nothingWidgetColors(FALLBACK_SEED, 'dark'));

// A DynamicScheme is rebuilt from its source color, grey-seed fallback included.
for (const seed of ['#d71921', '#888888']) {
  assert.deepEqual(
    nothingWidgetColors(new SchemeTonalSpot(Hct.fromInt(argbFromHex(seed)), true, 0), 'dark'),
    nothingWidgetColors(seed, 'dark'),
    `DynamicScheme from ${seed}`);
}

// Shared exports can't be changed by one consumer for everyone else.
assert.ok(Object.isFrozen(TOKENS.light.widgetBg.shade));
assert.throws(() => { 'use strict'; TOKENS.light.widgetBg.shade[1] = 900; }, TypeError);

// Anything unrecognized should fail loudly rather than quietly return grey fallbacks.
const scheme = themeFromSourceColor(argbFromHex('#d71921')).schemes.dark;
assert.throws(() => nothingWidgetColors(scheme, 'dark'), TypeError, 'a Scheme is not a palette');
assert.throws(() => nothingWidgetColors({ foo: 1 }, 'dark'), /unrecognized palette/);
assert.throws(() => nothingWidgetColors(true, 'dark'), TypeError);
for (const bad of ['red', '#ff000080', '#12345', '']) {
  assert.throws(() => nothingWidgetColors(bad, 'light'), TypeError, `bad seed ${bad}`);
}
assert.deepEqual(nothingWidgetColors('#f00', 'light'), nothingWidgetColors('#ff0000', 'light'), 'short hex is accepted');
// A small int is almost certainly a shade or tone passed by mistake, not a color.
assert.throws(() => nothingWidgetColors(50, 'light'), TypeError);
assert.throws(() => nothingWidgetColors(0x00d71921, 'light'), TypeError, 'transparent ARGB');

assert.throws(() => nothingWidgetColors(null, 'Dark'), TypeError);
assert.throws(() => nothingWidgetColors(null, 'toString'), /unknown mode/);

// The README's Tokens table is written by hand; keep it matching TOKENS.
{
  const readme = readFileSync(new URL('./README.md', import.meta.url), 'utf8');
  const cell = t => t.static ? `\`${t.static}\`` : `\`system_${t.shade[0]}_${t.shade[1]}\`${t.lstar !== undefined ? ` at lStar ${t.lstar}` : ''}`;
  for (const name of Object.keys(TOKENS.light)) {
    const row = `| \`${name}\` | ${cell(TOKENS.light[name])} | ${cell(TOKENS.dark[name])} |`;
    assert.ok(readme.includes(row), `README Tokens table row for ${name} should be: ${row}`);
  }
}

console.log('ok');
