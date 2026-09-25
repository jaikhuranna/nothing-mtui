export type Mode = 'light' | 'dark';
/**
 * Which Android palette math to use for seeds. '2025' is Android 16 QPR1 and
 * later (the default); '2021' is Android 14 to 16 QPR0.
 */
export type Spec = '2025' | '2021';
export type PaletteKey = 'neutral1' | 'neutral2' | 'accent1' | 'accent2';
/** Android shade, as in `system_neutral1_50`. Not a Material tone. */
export type Shade = 0 | 10 | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000;

/** A color: `'#rrggbb'` or `'#rgb'` (`#` optional), or an opaque 32-bit ARGB int, signed or unsigned. */
export type Seed = string | number;

/**
 * Every shade of every key, as built by `paletteFromSeed`. It records the spec
 * and mode it was built for; `nothingWidgetColors` refuses it in the other mode.
 */
export type Palette = Record<PaletteKey, Record<Shade, string>> & { readonly spec: Spec; readonly mode: Mode };

/**
 * A palette read off a device, in the mode you'll use it for. Colors are
 * anything `Seed` accepts. Only the shades the tokens use are required; a
 * missing or unreadable one throws a TypeError naming it. If `mode` is set and
 * doesn't match, it throws too.
 */
export type DevicePalette = Record<PaletteKey, Partial<Record<Shade, string | number>>> & { readonly mode?: Mode };

/**
 * Anything carrying the seed it was built from: a material-color-utilities
 * Theme (`source`) or DynamicScheme (`sourceColorArgb`). Typed by shape so any
 * version of that library works.
 */
export type SeededScheme = { readonly source: number } | { readonly sourceColorArgb: number };

export type TokenName =
  | 'widgetBg' | 'settingsBg' | 'widgetElements' | 'widgetFood' | 'widgetIcon'
  | 'mediaPageIndicator' | 'mediaPageIndicatorSelected' | 'mediaText' | 'mediaProgress'
  | 'mediaProgressBg' | 'mediaSwitchIcon' | 'mediaSwitchIconBg'
  | 'settingsAccent' | 'settingsStateOn' | 'settingsStateOff' | 'settingsThumbOff'
  | 'settingsTrackOff' | 'settingsTrackOn';

/** Resolved `#rrggbb` color for each token. */
export type WidgetColors = Record<TokenName, string>;

export type Token =
  | { readonly shade: readonly [PaletteKey, Shade]; readonly lstar?: number }
  | { readonly static: string };

/**
 * Nothing widget colors for a wallpaper. A Theme or DynamicScheme is rebuilt
 * from the seed it carries; `null` or `undefined` uses `FALLBACK_SEED`.
 * `spec` only matters for seeds, not for a device palette.
 */
export function nothingWidgetColors(
  palette: Seed | SeededScheme | DevicePalette | null | undefined,
  mode?: Mode,
  options?: { spec?: Spec },
): WidgetColors;

/**
 * The wallpaper palette Android builds from a seed (its default TONAL_SPOT
 * style). In the 2025 spec, accent1 differs between light and dark mode.
 */
export function paletteFromSeed(seed: Seed, options?: { spec?: Spec; mode?: Mode }): Palette;

/**
 * Sets CIE L* and keeps hue/chroma, like `android:lStar`. Takes anything
 * `Seed` accepts and returns lowercase '#rrggbb'; an lStar
 * outside 0–100 leaves the color unchanged.
 */
export function withLstar(color: Seed, lstar: number): string;

export const TOKENS: { readonly [M in Mode]: { readonly [T in TokenName]: Token } };

/** Seed used when no palette is given: blue-grey `#8a8f99`, not Android's own static colors. */
export const FALLBACK_SEED: '#8a8f99';
