// End-to-end: what a consumer (web or React Native) actually writes.
// Material You gives you a Theme; this package turns it into Nothing's
// widget colors.
import { themeFromSourceColor, argbFromHex } from '@material/material-color-utilities';
import { nothingWidgetColors, paletteFromSeed } from '../index.js';

// 1. Wallpaper seed -> Material You theme, straight from the upstream package.
const seed = process.argv[2] ?? '#d71921';
paletteFromSeed(seed); // throws on a bad color, which argbFromHex below wouldn't
const theme = themeFromSourceColor(argbFromHex(seed));

// 2. Theme -> Nothing widget colors.
for (const mode of ['light', 'dark']) {
  const c = nothingWidgetColors(theme, mode);
  console.log(`\n${mode}  (seed ${seed})`);
  console.log(`  widgetBg        ${c.widgetBg}   <- the Nothing widget background`);
  console.log(`  settingsBg      ${c.settingsBg}`);
  console.log(`  widgetElements  ${c.widgetElements}`);
  console.log(`  settingsAccent  ${c.settingsAccent}`);
  console.log(`  settingsTrackOn ${c.settingsTrackOn}`);
}
