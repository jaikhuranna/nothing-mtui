# nothing-mtui

Nothing widget color tokens, lifted from `com.nothing.communitywidgets-52` (res/values/colors.xml).

Unofficial and not affiliated with, endorsed by, or supported by Nothing Technology Limited.
The token values are factual color data; the package is a mapping convenience.

Logic found in the APK: widget backgrounds use Android Material You dynamic
neutrals (`@android:color/system_neutral1_50` light / `_900` dark), elements stay
monochrome black/white, accents use `system_accent1/accent2`. Dark tones are
lifted from `values-night/colors.xml`; tones not overridden there resolve
against the dark palette (modeled as the same tone). One nuance: dark
`widget_settings_bg` forces `android:lStar="12"` in the APK, which this package
applies on top of neutral1 tone 900.

## Usage

Works anywhere JavaScript runs — web, and React Native (including React Native
on Android). A native Kotlin/Java app does not need this package: Android 12+
exposes the same colors directly as `android.R.color.system_neutral1_50` etc.,
so there you only need the token mapping under [Tokens](#tokens).

```js
import { themeFromSourceColor, argbFromHex } from '@material/material-color-utilities';
import { nothingWidgetColors } from 'nothing-mtui';

// Material You gives you a Theme; pass it straight in.
const theme = themeFromSourceColor(argbFromHex('#d71921'));
const colors = nothingWidgetColors(theme, 'dark');
colors.widgetBg; // '#201a19' — background for the Nothing widget

// Or skip Material You and pass the wallpaper seed directly.
nothingWidgetColors('#d71921', 'dark');

// No palette: static fallback approximations.
nothingWidgetColors(null, 'light');
```

A runnable version of this is in `sample/material-you-to-nothing.mjs`:

```
node sample/material-you-to-nothing.mjs '#2e7d32'
```

`palette` is a seed hex string, a material-color-utilities `Theme`, or an object of the shape
`{ neutral1: {tone: hex}, neutral2: {...}, accent1: {...}, accent2: {...} }`
where tone is one of 0, 10, 50, 100…900, 1000. On a dynamic-color device,
`system_neutral1_*` etc. resolve from wallpaper. Pass that palette in for exact
Nothing OS behavior; omit it for static approximations.

## Exports

- `nothingWidgetColors(palette, mode)` — resolved tokens for `'light'` / `'dark'`.
- `paletteFromTheme(theme)` — converts a material-color-utilities `Theme` (or its
  `palettes` object) to this package's palette shape. `primary`/`secondary` map to
  AOSP's `accent1`/`accent2`, `neutral`/`neutralVariant` to `neutral1`/`neutral2`.
- `paletteFromSeed(seed)` — builds the AOSP wallpaper palette from a seed hex,
  via `CorePalette` (neutral1 chroma 4, neutral2 8, accent1 max(48, seed), accent2 16).
  A seed with chroma under 5 has no usable hue, so AOSP substitutes a fixed blue
  (`#1b6ef3`); this does the same.
- `withLstar(hex, lstar)` — forces CIE L\* while preserving hue/chroma, matching
  Android's `android:lStar` attribute.
- `TOKENS` — the raw token-to-resource mapping.
- `FALLBACKS` — static palette used when no palette is supplied.

## Tokens

- `widgetBg`, `settingsBg`, `widgetElements`, `widgetFood`, `widgetIcon`
- `mediaPageIndicator`, `mediaPageIndicatorSelected`, `mediaText`, `mediaProgress`, `mediaProgressBg`, `mediaSwitchIcon`, `mediaSwitchIconBg`
- `settingsAccent`, `settingsStateOn`, `settingsStateOff`, `settingsThumbOff`, `settingsTrackOff`, `settingsTrackOn`

Fallback hexes approximate Android's static Material You fallbacks; swap them if
you need exact non-dynamic-device values.

Origin: decompiled APK (nothing-mtui session). Tokens are Nothing's; this package
is a mapping convenience.

## Licence

The original code in this repository is released under the [MIT License](LICENSE).

The files under `sample/apk-fixtures/` are resources extracted from Nothing's
`com.nothing.communitywidgets` app, are © Nothing Technology Limited, and are
**not** covered by the MIT License. They are included only as test fixtures and
are not part of the published npm package.

"Nothing" is a trademark of Nothing Technology Limited, used here only to
describe what this package is compatible with.
