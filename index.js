import { Hct, TonalPalette, argbFromHex, hexFromArgb } from '@material/material-color-utilities';

// --- Material You palette generation (@material/material-color-utilities) ---
// AOSP SystemColors mapping (frameworks/base ColorScheme.java): wallpaper hue
// with fixed chromas. system_(key)_N resolves to tonal palette tone 100 - N/10.
const TONES = [10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

export function paletteFromSeed(seed) {
  const hct = Hct.fromInt(argbFromHex(seed));
  const palettes = {
    neutral1: TonalPalette.fromHueAndChroma(hct.hue, 4),
    neutral2: TonalPalette.fromHueAndChroma(hct.hue, 8),
    accent1: TonalPalette.fromHueAndChroma(hct.hue, Math.max(48, hct.chroma)),
    accent2: TonalPalette.fromHueAndChroma(hct.hue, Math.max(16, hct.chroma / 3)),
  };
  const out = {};
  for (const [key, p] of Object.entries(palettes)) {
    out[key] = {};
    for (const n of TONES) out[key][n] = hexFromArgb(p.tone(100 - n / 10));
  }
  return out;
}

// lStar attribute (android:lStar) forces CIE L*, preserving hue/chroma.
export function withLstar(hex, lstar) {
  const hct = Hct.fromInt(argbFromHex(hex));
  return hexFromArgb(Hct.from(hct.hue, hct.chroma, lstar).toInt());
}

// Static fallbacks for non-dynamic contexts: generated from a neutral seed
// (blue-gray, like AOSP's static fallback values) with the same tonal math.
export const FALLBACKS = Object.fromEntries(
  Object.entries(paletteFromSeed('#8a8f99')).flatMap(([key, tones]) =>
    Object.entries(tones).map(([n, hex]) => [`${key}_${n}`, hex])));

// Token mappings lifted from com.nothing.communitywidgets:
//   light — res/values/colors.xml
//   dark  — res/values-night/colors.xml
// Tone tokens reference a Material You palette: { neutral1: {50: '#hex'}, ... }.
export const TOKENS = {
  light: {
    widgetBg: { tone: ['neutral1', 50] },
    settingsBg: { tone: ['neutral1', 50] },
    widgetElements: { static: '#000000' },
    widgetFood: { static: '#d71921' },
    widgetIcon: { static: '#ffffff' },
    mediaPageIndicator: { tone: ['neutral1', 200] },
    mediaPageIndicatorSelected: { tone: ['neutral1', 800] },
    mediaText: { tone: ['neutral1', 900] },
    mediaProgress: { tone: ['neutral1', 900] },
    mediaProgressBg: { tone: ['neutral1', 100] },
    mediaSwitchIcon: { tone: ['neutral1', 900] },
    mediaSwitchIconBg: { tone: ['neutral1', 100] },
    settingsAccent: { tone: ['accent1', 600] },
    settingsStateOn: { tone: ['accent1', 100] },
    settingsStateOff: { tone: ['accent2', 100] },
    settingsThumbOff: { tone: ['neutral2', 100] },
    settingsTrackOff: { tone: ['neutral2', 600] },
    settingsTrackOn: { tone: ['accent1', 600] },
  },
  dark: {
    widgetBg: { tone: ['neutral1', 900] },
    // widget_settings_bg dark = neutral1_900 with android:lStar="12"
    settingsBg: { tone: ['neutral1', 900], lstar: 12 },
    widgetElements: { static: '#ffffff' },
    widgetFood: { static: '#d71921' },
    widgetIcon: { static: '#ffffff' },
    mediaPageIndicator: { tone: ['neutral1', 600] },
    mediaPageIndicatorSelected: { tone: ['neutral1', 10] },
    mediaText: { tone: ['neutral1', 50] },
    mediaProgress: { tone: ['neutral1', 50] },
    mediaProgressBg: { tone: ['neutral1', 800] },
    mediaSwitchIcon: { tone: ['neutral1', 50] },
    mediaSwitchIconBg: { tone: ['neutral1', 800] },
    settingsAccent: { tone: ['accent1', 100] },
    // not overridden in values-night: same tones resolve against the dark palette
    settingsStateOn: { tone: ['accent1', 100] },
    settingsStateOff: { tone: ['accent2', 100] },
    settingsThumbOff: { tone: ['neutral2', 300] },
    settingsTrackOff: { tone: ['neutral1', 700] },
    settingsTrackOn: { tone: ['accent2', 700] },
  },
};

// palette: Material You palette object or a seed hex color
export function nothingWidgetColors(palette, mode = 'light') {
  if (typeof palette === 'string') palette = paletteFromSeed(palette);
  const tokens = TOKENS[mode];
  if (!tokens) throw new Error(`unknown mode: ${mode}`);
  const out = {};
  for (const [name, token] of Object.entries(tokens)) {
    if (token.static !== undefined) {
      out[name] = token.static;
      continue;
    }
    const [key, tone] = token.tone;
    const hex = palette?.[key]?.[tone] ?? FALLBACKS[`${key}_${tone}`];
    out[name] = token.lstar ? withLstar(hex, token.lstar) : hex;
  }
  return out;
}
