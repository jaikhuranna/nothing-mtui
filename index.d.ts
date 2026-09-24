import type { DynamicScheme, Theme } from '@material/material-color-utilities';

export type Mode = 'light' | 'dark';
export type PaletteKey = 'neutral1' | 'neutral2' | 'accent1' | 'accent2';
/** Android shade, as in `system_neutral1_50`. Not a Material tone. */
export type Shade = 0 | 10 | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000;

/** A seed color: `'#rrggbb'`, `'#rgb'`, or an ARGB number. */
export type Seed = string | number;

/** Every shade of every key, as built by `paletteFromSeed`. */
export type Palette = Record<PaletteKey, Record<Shade, string>>;

/**
 * A palette read off a device. Only the shades the tokens use are required;
 * a missing or non-`#rrggbb` one throws a TypeError naming it.
 */
export type DevicePalette = Partial<Record<PaletteKey, Partial<Record<Shade, string>>>>;

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
 * from the seed it carries; `null` uses `FALLBACKS`.
 */
export function nothingWidgetColors(
  palette: Seed | Theme | DynamicScheme | DevicePalette | null | undefined,
  mode?: Mode,
): WidgetColors;

/** The wallpaper palette Android 14–16 build from a seed (SchemeTonalSpot). */
export function paletteFromSeed(seed: Seed): Palette;

/** Sets CIE L* and keeps hue/chroma, like `android:lStar`. Out-of-range lStar returns `hex` unchanged. */
export function withLstar(hex: string, lstar: number): string;

export const TOKENS: { readonly [M in Mode]: { readonly [T in TokenName]: Token } };

/** Palette generated from the blue-grey seed `#8a8f99`, used for `null`. */
export const FALLBACKS: { readonly [K in PaletteKey]: { readonly [S in Shade]: string } };
