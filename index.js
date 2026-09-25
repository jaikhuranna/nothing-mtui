import { Hct, SchemeTonalSpot, TonalPalette, argbFromHex, hexFromArgb } from '@material/material-color-utilities';

// Android exposes wallpaper colors as system_{key}_{shade}, where shade N is
// tone 100 - N/10 of that key's tonal palette.
const SHADES = [0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
const KEYS = ['neutral1', 'neutral2', 'accent1', 'accent2'];
const MODES = ['light', 'dark'];
const SPECS = ['2025', '2021'];

// A near-grey wallpaper has no real hue, so Android builds the palette from
// this blue instead.
const GOOGLE_BLUE = '#1b6ef3';
const MIN_SEED_CHROMA = 5;

function deepFreeze(obj) {
  for (const value of Object.values(obj)) if (value && typeof value === 'object') deepFreeze(value);
  return Object.freeze(obj);
}

// Android's Color ints are signed 32-bit and material-color-utilities' are
// unsigned, so accept either range. Colors here are opaque, so a small int
// (a shade or tone passed by mistake) is refused rather than read as black.
const isArgb = n => Number.isInteger(n) && n >= -0x80000000 && n <= 0xffffffff && ((n >>> 24) & 0xff) === 0xff;

function argbFromSeed(seed) {
  const hex = normalizeColor(seed);
  if (hex === undefined) throw new TypeError(`expected a '#rrggbb' color or an opaque ARGB int, got ${JSON.stringify(seed)}`);
  return argbFromHex(hex);
}

function averageArgb(a, b) {
  const channel = shift => Math.round((((a >>> shift) & 0xff) + ((b >>> shift) & 0xff)) / 2);
  return (0xff000000 | (channel(16) << 16) | (channel(8) << 8) | channel(0)) >>> 0;
}

// Tone 99 of a yellow palette comes out greenish, so the 2025 spec averages
// tones 98 and 100 there instead (libmonet TonalPalette, Android 16 QPR1+).
function tone2025(palette, tone) {
  if (tone === 99 && palette.hue >= 105 && palette.hue < 125) {
    return averageArgb(palette.tone(98), palette.tone(100));
  }
  return palette.tone(tone);
}

function readOptions(options, name) {
  if (options == null) return {};
  if (typeof options !== 'object') {
    throw new TypeError(`${name} options must be an object like { spec: '2021' }, got ${JSON.stringify(options)}`);
  }
  return options;
}

function checkOptions(spec, mode) {
  if (!SPECS.includes(spec)) throw new TypeError(`unknown spec: ${JSON.stringify(spec)} (expected ${SPECS.join(' or ')})`);
  if (!MODES.includes(mode)) throw new TypeError(`unknown mode: ${JSON.stringify(mode)} (expected light or dark)`);
}

// Android's wallpaper palette (the default TONAL_SPOT style). Chromas by spec:
//   '2025' (Android 16 QPR1 and later): accent1 32, or 26 in dark mode;
//          accent2 16; neutral1 5; neutral2 8.5
//   '2021' (Android 14 to 16 QPR0):      accent1 36, accent2 16, neutral1 6,
//          neutral2 8, the same in both modes
// Android 12 and 13 used other chromas again and aren't modeled.
// The result records its spec and mode, because a 2025 palette only fits the
// mode it was built for; nothingWidgetColors refuses it in the other one.
export function paletteFromSeed(seed, options) {
  const { spec = '2025', mode = 'light' } = readOptions(options, 'paletteFromSeed');
  checkOptions(spec, mode);
  let argb = argbFromSeed(seed);
  if (Hct.fromInt(argb).chroma < MIN_SEED_CHROMA) argb = argbFromHex(GOOGLE_BLUE);
  const hue = Hct.fromInt(argb).hue;
  let palettes;
  let tone = (palette, t) => palette.tone(t);
  if (spec === '2021') {
    const scheme = new SchemeTonalSpot(Hct.fromInt(argb), false, 0);
    palettes = {
      neutral1: scheme.neutralPalette,
      neutral2: scheme.neutralVariantPalette,
      accent1: scheme.primaryPalette,
      accent2: scheme.secondaryPalette,
    };
  } else {
    // material-color-utilities only has the 2025 spec from 0.4.0, which can't
    // be imported by plain Node, so its TONAL_SPOT chromas are written out here.
    palettes = {
      neutral1: TonalPalette.fromHueAndChroma(hue, 5),
      neutral2: TonalPalette.fromHueAndChroma(hue, 5 * 1.7),
      accent1: TonalPalette.fromHueAndChroma(hue, mode === 'dark' ? 26 : 32),
      accent2: TonalPalette.fromHueAndChroma(hue, 16),
    };
    tone = tone2025;
  }
  const out = { spec, mode };
  for (const [key, palette] of Object.entries(palettes)) {
    out[key] = {};
    for (const n of SHADES) out[key][n] = hexFromArgb(tone(palette, 100 - n / 10));
  }
  return out;
}

// Mirrors Android's ColorStateList.modulateColor: sets CIE L* and keeps hue
// and chroma, and leaves the color alone when lStar is outside 0-100.
export function withLstar(color, lstar) {
  const hex = normalizeColor(color);
  if (hex === undefined) throw new TypeError(`expected a '#rrggbb' color or an opaque ARGB int, got ${JSON.stringify(color)}`);
  if (typeof lstar !== 'number') throw new TypeError(`expected lstar to be a number, got ${JSON.stringify(lstar)}`);
  if (!(lstar >= 0 && lstar <= 100)) return hex;
  const hct = Hct.fromInt(argbFromHex(hex));
  return hexFromArgb(Hct.from(hct.hue, hct.chroma, lstar).toInt());
}

// Used when no palette is given. A blue-grey seed, not Android's own static
// colors.
export const FALLBACK_SEED = '#8a8f99';

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

// nothingWidgetColors is often called on every render with the same seed, so
// keep the last few palettes around.
const cache = new Map();
function cachedPalette(seed, spec, mode) {
  const key = `${typeof seed}:${seed}:${spec}:${mode}`;
  let palette = cache.get(key);
  if (palette) {
    cache.delete(key); // re-inserted below, so the least recently used goes first
  } else {
    palette = paletteFromSeed(seed, { spec, mode });
    if (cache.size >= 8) cache.delete(cache.keys().next().value);
  }
  cache.set(key, palette);
  return palette;
}

// A Theme (themeFromSourceColor) or DynamicScheme carries the seed it was
// built from. Both get rebuilt from that seed, because this package models
// Android's default wallpaper style rather than whatever the object used.
function seedOf(x) {
  if (isArgb(x.source)) return x.source;
  if (isArgb(x.sourceColorArgb)) return x.sourceColorArgb;
  return undefined;
}

// Accepts '#rrggbb' or '#rgb' (any case, '#' optional) or an opaque ARGB int.
// 8-digit strings are refused because Android writes them #AARRGGBB and CSS
// writes #RRGGBBAA.
function normalizeColor(value) {
  if (isArgb(value)) return hexFromArgb(value);
  const m = typeof value === 'string' && /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value);
  if (!m) return undefined;
  const hex = m[1].length === 3 ? [...m[1]].map(c => c + c).join('') : m[1];
  return `#${hex.toLowerCase()}`;
}

function readDevicePalette(palette, mode) {
  const out = {};
  const missing = new Set();
  const unreadable = new Set();
  for (const token of Object.values(TOKENS[mode])) {
    if (!token.shade) continue;
    const [key, shade] = token.shade;
    const value = palette[key]?.[shade];
    const hex = normalizeColor(value);
    if (value === undefined) missing.add(`${key}_${shade}`);
    else if (hex === undefined) unreadable.add(`${key}_${shade} (${JSON.stringify(value)})`);
    else (out[key] = out[key] || {})[shade] = hex;
  }
  if (missing.size) {
    throw new TypeError(`palette is missing ${[...missing].join(', ')} (keys are Android shades like 50 and 900, not tones)`);
  }
  if (unreadable.size) {
    throw new TypeError(`palette colors must be '#rrggbb' or an ARGB int: ${[...unreadable].join(', ')}`);
  }
  return out;
}

// palette: a seed (#rrggbb or ARGB number), a material-color-utilities Theme
// or DynamicScheme, a { neutral1: {shade: hex}, ... } palette read from a
// device, or null/undefined for FALLBACK_SEED. `spec` picks the Android
// palette math for seeds (see paletteFromSeed).
export function nothingWidgetColors(palette, mode = 'light', options) {
  const { spec = '2025' } = readOptions(options, 'nothingWidgetColors');
  checkOptions(spec, mode);
  if (palette == null) {
    palette = cachedPalette(FALLBACK_SEED, spec, mode);
  } else if (typeof palette === 'string' || typeof palette === 'number') {
    palette = cachedPalette(palette, spec, mode);
  } else if (typeof palette !== 'object') {
    throw new TypeError(`unsupported palette: ${typeof palette}`);
  } else if (KEYS.some(k => k in palette)) {
    if (palette.mode !== undefined && palette.mode !== mode) {
      throw new TypeError(`palette was built for ${palette.mode} mode; build one with paletteFromSeed(seed, { mode: '${mode}' })`);
    }
    palette = readDevicePalette(palette, mode);
  } else {
    const seed = seedOf(palette);
    if (seed === undefined) {
      throw new TypeError(`unrecognized palette: expected a seed, Theme, DynamicScheme, or an object with ${KEYS.join('/')}`);
    }
    palette = cachedPalette(seed, spec, mode);
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
