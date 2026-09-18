import assert from 'node:assert/strict';
import { nothingWidgetColors, TOKENS } from './index.js';

for (const mode of ['light', 'dark']) {
  const colors = nothingWidgetColors(null, mode);
  assert.equal(Object.keys(colors).length, Object.keys(TOKENS[mode]).length, `${mode} token count`);
  for (const [name, value] of Object.entries(colors)) {
    assert.equal(typeof value, 'string', `${mode}.${name} must resolve, got ${value}`);
  }
}

const light = nothingWidgetColors(null, 'light');
const dark = nothingWidgetColors(null, 'dark');

assert.equal(light.widgetBg, '#e5e5e5');
assert.equal(dark.widgetBg, '#1b1b1b');
assert.equal(light.widgetElements, '#000000');
assert.equal(dark.widgetElements, '#ffffff');
assert.equal(light.widgetFood, '#d71921');
assert.equal(dark.widgetFood, '#d71921');
assert.equal(light.mediaPageIndicator, '#b8b8b8');
assert.equal(dark.mediaPageIndicator, '#565656');
assert.equal(dark.mediaPageIndicatorSelected, '#0f0f0f');
assert.equal(light.settingsTrackOff, '#565656');
assert.equal(dark.settingsTrackOff, '#3f3f3f');
assert.equal(dark.settingsTrackOn, '#3f3f3f');

const palette = { neutral1: { 50: '#fafafa', 900: '#111111', 10: '#0a0a0a' } };
assert.equal(nothingWidgetColors(palette, 'light').widgetBg, '#fafafa');
assert.equal(nothingWidgetColors(palette, 'dark').widgetBg, '#111111');
assert.equal(nothingWidgetColors(palette, 'dark').mediaPageIndicatorSelected, '#0a0a0a');
assert.equal(nothingWidgetColors(palette, 'light').widgetElements, '#000000', 'static survives palette');

assert.throws(() => nothingWidgetColors(null, 'Dark'), /unknown mode/);

console.log('ok');
