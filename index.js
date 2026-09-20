import { CorePalette, Hct, argbFromHex, hexFromArgb } from '@material/material-color-utilities';

// --- Material You palette generation (@material/material-color-utilities) ---
// AOSP SystemColors mapping (frameworks/base ColorScheme): wallpaper seed ->
// CorePalette. system_(key)_N resolves to tonal palette tone 100 - N/10.
const TONES = [0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

// A near-grey wallpaper has no meaningful hue, so AOSP swaps in a fixed blue
// rather than amplifying whatever hue the quantizer happened to land on.
const GOOGLE_BLUE = '#1b6ef3';
const MIN_SEED_CHROMA = 5;

function expand(sources) {
  const out = {};
  for (const [key, palette] of Object.entries(sources)) {
    out[key] = {};
    for (const n of TONES) out[key][n] = hexFromArgb(palette.tone(100 - n / 10));
  }
  return out;
}

export function paletteFromSeed(seed) {
  let argb = argbFromHex(seed);
  if (Hct.fromInt(argb).chroma < MIN_SEED_CHROMA) argb = argbFromHex(GOOGLE_BLUE);
  const core = CorePalette.of(argb);
  return expand({ neutral1: core.n1, neutral2: core.n2, accent1: core.a1, accent2: core.a2 });
}

// themeFromSourceColor/themeFromImage return the same CorePalette under
// Material's names: primary/secondary are AOSP's accent1/accent2, and
// neutral/neutralVariant are neutral1/neutral2. When the theme carries its
// source color, recompute through paletteFromSeed instead of trusting
// theme.palettes directly, so the low-chroma-seed fallback still applies —
// theme.palettes was built by CorePalette.of(source) with no such fallback.
// Without a source (a caller passed the bare palettes object), that fallback
// can't be recovered and theme.palettes is used as-is.
export function paletteFromTheme(theme) {
  if (theme?.source !== undefined) return paletteFromSeed(hexFromArgb(theme.source));
  const p = theme.palettes ?? theme;
  return expand({ neutral1: p.neutral, neutral2: p.neutralVariant, accent1: p.primary, accent2: p.secondary });
}

function isThemeLike(palette) {
  if (!palette) return false;
  if (palette.source !== undefined) return true;
  const p = palette.palettes ?? palette;
  return p?.primary !== undefined || p?.neutral !== undefined;
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

// palette: a seed hex, a material-color-utilities Theme, or a resolved
// { neutral1: {tone: hex}, ... } palette object.
export function nothingWidgetColors(palette, mode = 'light') {
  if (typeof palette === 'string') palette = paletteFromSeed(palette);
  else if (isThemeLike(palette)) palette = paletteFromTheme(palette);
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
    out[name] = token.lstar !== undefined ? withLstar(hex, token.lstar) : hex;
  }
  return out;
}
