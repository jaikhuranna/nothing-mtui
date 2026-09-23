import { Hct, SchemeTonalSpot, argbFromHex, hexFromArgb } from '@material/material-color-utilities';

// Android exposes wallpaper colors as system_{key}_{shade}, where shade N is
// tone 100 - N/10 of that key's tonal palette.
const SHADES = [0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
const KEYS = ['neutral1', 'neutral2', 'accent1', 'accent2'];

// A near-grey wallpaper has no real hue, so Android builds the palette from
// this blue instead.
const GOOGLE_BLUE = '#1b6ef3';
const MIN_SEED_CHROMA = 5;

const isTonalPalette = p => typeof p?.tone === 'function';

function expand(palettes) {
  const out = {};
  for (const [key, palette] of Object.entries(palettes)) {
    out[key] = {};
    for (const n of SHADES) out[key][n] = hexFromArgb(palette.tone(100 - n / 10));
  }
  return out;
}

function fromDynamicScheme(scheme) {
  return expand({
    neutral1: scheme.neutralPalette,
    neutral2: scheme.neutralVariantPalette,
    accent1: scheme.primaryPalette,
    accent2: scheme.secondaryPalette,
  });
}

function argbFromSeed(seed) {
  if (Number.isInteger(seed)) return seed;
  if (typeof seed === 'string' && /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(seed)) return argbFromHex(seed);
  throw new TypeError(`expected a #rrggbb color or an ARGB number, got ${JSON.stringify(seed)}`);
}

// Android 14 and later build the system palette with SchemeTonalSpot
// (accent1 chroma 36, accent2 16, neutral1 6, neutral2 8). Android 12 and 13
// used slightly different chromas, so colors there will be a little off.
export function paletteFromSeed(seed) {
  let argb = argbFromSeed(seed);
  if (Hct.fromInt(argb).chroma < MIN_SEED_CHROMA) argb = argbFromHex(GOOGLE_BLUE);
  return fromDynamicScheme(new SchemeTonalSpot(Hct.fromInt(argb), false, 0));
}

// Accepts a DynamicScheme (used as-is), a Theme from themeFromSourceColor
// (rebuilt from its source color, because its palettes use Android 12's
// chromas), or a Theme's bare `palettes` object (used as-is).
export function paletteFromTheme(theme) {
  if (isTonalPalette(theme?.primaryPalette)) return fromDynamicScheme(theme);
  if (Number.isInteger(theme?.source)) return paletteFromSeed(theme.source);
  const p = theme?.palettes ?? theme;
  if (![p?.neutral, p?.neutralVariant, p?.primary, p?.secondary].every(isTonalPalette)) {
    throw new TypeError('expected a material-color-utilities Theme, its palettes, or a DynamicScheme');
  }
  return expand({ neutral1: p.neutral, neutral2: p.neutralVariant, accent1: p.primary, accent2: p.secondary });
}

function isThemeLike(x) {
  return isTonalPalette(x.primaryPalette) || Number.isInteger(x.source) || isTonalPalette((x.palettes ?? x).primary);
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

// palette: a seed (#rrggbb or ARGB number), a material-color-utilities Theme
// or DynamicScheme, a { neutral1: {shade: hex}, ... } object, or null for the
// static fallbacks.
export function nothingWidgetColors(palette, mode = 'light') {
  if (!Object.prototype.hasOwnProperty.call(TOKENS, mode)) throw new Error(`unknown mode: ${mode}`);
  if (typeof palette === 'string' || typeof palette === 'number') {
    palette = paletteFromSeed(palette);
  } else if (palette != null) {
    if (typeof palette !== 'object') throw new TypeError(`unsupported palette: ${typeof palette}`);
    if (isThemeLike(palette)) palette = paletteFromTheme(palette);
    else if (!KEYS.some(k => k in palette)) {
      throw new TypeError(`unrecognized palette: expected a seed, Theme, DynamicScheme, or an object with ${KEYS.join('/')}`);
    }
  }
  const out = {};
  for (const [name, token] of Object.entries(TOKENS[mode])) {
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
