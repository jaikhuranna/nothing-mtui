import assert from 'node:assert/strict';
import { nothingWidgetColors, paletteFromSeed, TOKENS } from './index.js';

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

assert.throws(() => nothingWidgetColors(null, 'Dark'), /unknown mode/);

console.log('ok');
