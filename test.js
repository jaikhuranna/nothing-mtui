import { nothingWidgetColors, TOKENS } from './index.js';

const light = nothingWidgetColors(null, 'light');
const dark = nothingWidgetColors(null, 'dark');

console.assert(light.widgetBg === '#e5e5e5', 'fallback bg');
console.assert(light.widgetElements === '#000000', 'elements black');
console.assert(dark.widgetElements === '#ffffff', 'elements white');
console.assert(light.widgetFood === '#d71921', 'food red');
console.assert(dark.widgetBg === '#1b1b1b', 'dark bg fallback');

const palette = { neutral1: { 50: '#fafafa', 900: '#111111' } };
const dynamic = nothingWidgetColors(palette, 'light');
console.assert(dynamic.widgetBg === '#fafafa', 'palette override light');
console.assert(nothingWidgetColors(palette, 'dark').widgetBg === '#111111', 'palette override dark');

console.assert(Object.keys(nothingWidgetColors(null, 'light')).length === Object.keys(TOKENS.light).length, 'token count');

console.log('ok');
