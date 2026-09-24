import { Hct, SchemeTonalSpot, argbFromHex, hexFromArgb } from '@material/material-color-utilities';

// Android exposes wallpaper colors as system_{key}_{shade}, where shade N is
// tone 100 - N/10 of that key's tonal palette.
const SHADES = [0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
const KEYS = ['neutral1', 'neutral2', 'accent1', 'accent2'];
const HEX = /^#[0-9a-f]{6}$/i;

// A near-grey wallpaper has no real hue, so Android builds the palette from
// this blue instead.
const GOOGLE_BLUE = '#1b6ef3';
const MIN_SEED_CHROMA = 5;

function deepFreeze(obj) {
  for (const value of Object.values(obj)) if (value && typeof value === 'object') deepFreeze(value);
  return Object.freeze(obj);
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
  const scheme = new SchemeTonalSpot(Hct.fromInt(argb), false, 0);
  const palettes = {
    neutral1: scheme.neutralPalette,
    neutral2: scheme.neutralVariantPalette,
    accent1: scheme.primaryPalette,
    accent2: scheme.secondaryPalette,
  };
  const out = {};
  for (const [key, palette] of Object.entries(palettes)) {
    out[key] = {};
    for (const n of SHADES) out[key][n] = hexFromArgb(palette.tone(100 - n / 10));
  }
  return out;
}

// Mirrors Android's ColorStateList.modulateColor: sets CIE L* and keeps hue
// and chroma, and leaves the color alone when lStar is outside 0-100.
export function withLstar(hex, lstar) {
  if (typeof hex !== 'string' || !HEX.test(hex)) throw new TypeError(`expected a #rrggbb color, got ${JSON.stringify(hex)}`);
  if (typeof lstar !== 'number') throw new TypeError(`expected lstar to be a number, got ${JSON.stringify(lstar)}`);
  if (!(lstar >= 0 && lstar <= 100)) return hex;
  const hct = Hct.fromInt(argbFromHex(hex));
  return hexFromArgb(Hct.from(hct.hue, hct.chroma, lstar).toInt());
}

// Used when no palette is given. It's generated from a blue-grey seed, not
// taken from Android's own static colors.
export const FALLBACKS = deepFreeze(paletteFromSeed('#8a8f99'));

// Token mappings lifted from com.nothing.communitywidgets:
//   light — res/values/colors.xml
//   dark  — res/values-night/colors.xml
// `shade: ['neutral1', 50]` means @android:color/system_neutral1_50.
export const TOKENS = deepFreeze({
  light: {
    widgetBg: { shade: ['neutral1', 50] },
    settingsBg: { shade: ['neutral1', 50] },
    widgetElements: { static: '#000000' },
    widgetFood: { static: '#d71921' },
    widgetIcon: { static: '#ffffff' },
    mediaPageIndicator: { shade: ['neutral1', 200] },
    mediaPageIndicatorSelected: { shade: ['neutral1', 800] },
    mediaText: { shade: ['neutral1', 900] },
    mediaProgress: { shade: ['neutral1', 900] },
    mediaProgressBg: { shade: ['neutral1', 100] },
    mediaSwitchIcon: { shade: ['neutral1', 900] },
    mediaSwitchIconBg: { shade: ['neutral1', 100] },
    settingsAccent: { shade: ['accent1', 600] },
    settingsStateOn: { shade: ['accent1', 100] },
    settingsStateOff: { shade: ['accent2', 100] },
    settingsThumbOff: { shade: ['neutral2', 100] },
    settingsTrackOff: { shade: ['neutral2', 600] },
    settingsTrackOn: { shade: ['accent1', 600] },
  },
  dark: {
    widgetBg: { shade: ['neutral1', 900] },
    // widget_settings_bg dark = neutral1_900 with android:lStar="12"
    settingsBg: { shade: ['neutral1', 900], lstar: 12 },
    widgetElements: { static: '#ffffff' },
    widgetFood: { static: '#d71921' },
    widgetIcon: { static: '#ffffff' },
    mediaPageIndicator: { shade: ['neutral1', 600] },
    mediaPageIndicatorSelected: { shade: ['neutral1', 10] },
    mediaText: { shade: ['neutral1', 50] },
    mediaProgress: { shade: ['neutral1', 50] },
    mediaProgressBg: { shade: ['neutral1', 800] },
    mediaSwitchIcon: { shade: ['neutral1', 50] },
    mediaSwitchIconBg: { shade: ['neutral1', 800] },
    settingsAccent: { shade: ['accent1', 100] },
    // not overridden in values-night, so these match light mode
    settingsStateOn: { shade: ['accent1', 100] },
    settingsStateOff: { shade: ['accent2', 100] },
    settingsThumbOff: { shade: ['neutral2', 300] },
    settingsTrackOff: { shade: ['neutral1', 700] },
    settingsTrackOn: { shade: ['accent2', 700] },
  },
});

// nothingWidgetColors is often called twice per render (light and dark) with
// the same seed, so keep the last palette around.
let lastSeed, lastPalette;
function cachedPalette(seed) {
  if (seed !== lastSeed) {
    lastPalette = paletteFromSeed(seed);
    lastSeed = seed;
  }
  return lastPalette;
}

// A Theme (themeFromSourceColor) or DynamicScheme carries the seed it was
// built from. Both get rebuilt from that seed, because this package models
// Android's default wallpaper style rather than whatever the object used.
function seedOf(x) {
  if (Number.isInteger(x.source)) return x.source;
  if (Number.isInteger(x.sourceColorArgb)) return x.sourceColorArgb;
  return undefined;
}

// Accepts what a device palette is likely to hold: '#rrggbb', '#aarrggbb'
// (with or without '#', any case) or an ARGB int. Alpha is dropped.
function normalizeColor(value) {
  if (Number.isInteger(value)) return hexFromArgb(value);
  const m = typeof value === 'string' && /^#?(?:[0-9a-f]{2})?([0-9a-f]{6})$/i.exec(value);
  return m ? `#${m[1].toLowerCase()}` : undefined;
}

function readDevicePalette(palette, mode) {
  const out = {};
  const bad = new Set();
  for (const token of Object.values(TOKENS[mode])) {
    if (!token.shade) continue;
    const [key, shade] = token.shade;
    const hex = normalizeColor(palette[key]?.[shade]);
    if (hex === undefined) bad.add(`${key}_${shade}`);
    else (out[key] = out[key] || {})[shade] = hex;
  }
  if (bad.size) {
    throw new TypeError(`palette needs a color for ${[...bad].join(', ')} (keys are Android shades like 50 and 900, not tones)`);
  }
  return out;
}

// palette: a seed (#rrggbb or ARGB number), a material-color-utilities Theme
// or DynamicScheme, a { neutral1: {shade: hex}, ... } palette read from a
// device, or null for FALLBACKS.
export function nothingWidgetColors(palette, mode = 'light') {
  if (!Object.prototype.hasOwnProperty.call(TOKENS, mode)) throw new Error(`unknown mode: ${mode}`);
  if (palette == null) {
    palette = FALLBACKS;
  } else if (typeof palette === 'string' || typeof palette === 'number') {
    palette = cachedPalette(palette);
  } else if (typeof palette !== 'object') {
    throw new TypeError(`unsupported palette: ${typeof palette}`);
  } else if (KEYS.some(k => k in palette)) {
    palette = readDevicePalette(palette, mode);
  } else {
    const seed = seedOf(palette);
    if (seed === undefined) {
      throw new TypeError(`unrecognized palette: expected a seed, Theme, DynamicScheme, or an object with ${KEYS.join('/')}`);
    }
    palette = cachedPalette(seed);
  }
  const out = {};
  for (const [name, token] of Object.entries(TOKENS[mode])) {
    if (token.static !== undefined) {
      out[name] = token.static;
      continue;
    }
    const [key, shade] = token.shade;
    const hex = palette[key][shade];
    out[name] = token.lstar !== undefined ? withLstar(hex, token.lstar) : hex;
  }
  return out;
}
