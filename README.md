# nothing-mtui

Nothing widget color tokens, lifted from `com.nothing.communitywidgets-52` (res/values/colors.xml).

Logic found in the APK: widget backgrounds use Android Material You dynamic
neutrals (`@android:color/system_neutral1_50` light / `_900` dark), elements stay
monochrome black/white, accents use `system_accent1/accent2`. Dark mode swaps two
values via `values-night`.

## Usage

```js
import { nothingWidgetColors } from 'nothing-mtui';

// No palette: static fallback approximations
const colors = nothingWidgetColors(null, 'light');

// With a Material You palette (e.g. { neutral1: { 50: '#fafafa', ... } })
const dynamic = nothingWidgetColors(palette, 'dark');
```

`palette` shape: `{ neutral1: {tone: hex}, neutral2: {...}, accent1: {...}, accent2: {...} }`
where tone is 0–1000. On a dynamic-color device, `system_neutral1_*` etc. resolve
from wallpaper. Pass that palette in for exact Nothing OS behavior; omit it for
static approximations.

## Tokens

- `widgetBg`, `widgetElements`, `widgetFood`, `widgetIcon`
- `mediaPageIndicator`, `mediaPageIndicatorSelected`, `mediaText`, `mediaProgress`, `mediaProgressBg`, `mediaSwitchIcon`, `mediaSwitchIconBg`
- `settingsAccent`, `settingsStateOn`, `settingsStateOff`, `settingsThumbOff`, `settingsTrackOff`, `settingsTrackOn`

Fallback hexes approximate Android's static Material You fallbacks; swap them if
you need exact non-dynamic-device values.

Origin: decompiled APK (nothing-mtui session). Tokens are Nothing's; this package
is a mapping convenience.
