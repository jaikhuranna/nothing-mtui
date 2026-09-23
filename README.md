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
colors.widgetBg; // '#231918' — background for the Nothing widget

// Or skip Material You and pass the wallpaper seed directly.
nothingWidgetColors('#d71921', 'dark');

// No palette: static fallback approximations.
nothingWidgetColors(null, 'light');
```

A runnable version of this is in `sample/material-you-to-nothing.mjs`:

```
node sample/material-you-to-nothing.mjs '#2e7d32'
```

`palette` is a seed (`'#rrggbb'` or an ARGB number), a material-color-utilities `Theme` or `DynamicScheme`, or an object of the shape
`{ neutral1: {tone: hex}, neutral2: {...}, accent1: {...}, accent2: {...} }`
where tone is one of 0, 10, 50, 100…900, 1000. On a dynamic-color device,
`system_neutral1_*` etc. resolve from wallpaper. Pass that palette in for exact
Nothing OS behavior; omit it for static approximations.

## Exports

- `nothingWidgetColors(palette, mode)` — resolved tokens for `'light'` / `'dark'`.
- `paletteFromTheme(theme)` — converts a material-color-utilities `DynamicScheme`,
  `Theme`, or a Theme's `palettes` object to this package's palette shape.
  `primary`/`secondary` map to Android's `accent1`/`accent2`, `neutral`/`neutralVariant`
  to `neutral1`/`neutral2`.
- `paletteFromSeed(seed)` — builds the wallpaper palette the way Android 14–16 do,
  via `SchemeTonalSpot` (accent1 chroma 36, accent2 16, neutral1 6, neutral2 8).
  Android 12 and 13 used slightly different chromas, so colors on those versions
  will be a little off. A seed with chroma under 5 has no usable hue, so Android
  substitutes a fixed blue (`#1b6ef3`); this does the same.
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

## APK fixtures

The mapping was checked against the app's own decoded resource files. Those
files belong to Nothing, so they are not in this repo. You only need them to
re-run that check (`npm run verify:apk`) or the page in `sample/lab`; the
package itself doesn't use them.

To get them, decode `com.nothing.communitywidgets` with apktool or jadx and copy
these files into `sample/apk-fixtures/`, keeping the folder structure:

```
values/colors.xml
values-night/colors.xml
color/default_color_background_dark.xml
drawable/widget_2x2_bg.xml
layout/widget_quotes_card_2x2.xml
layout/widget_snake_card_2x2.xml
layout/mediaplayer_widget_container.xml
```

`sample/apk-fixtures/` is gitignored, so they won't get committed by accident.

## Licence

The code in this repository is released under the [MIT License](LICENSE).

"Nothing" is a trademark of Nothing Technology Limited, used here only to
describe what this package is compatible with.
