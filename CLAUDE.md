# nothing-mtui

## Goal

Publish an npm package (`nothing-mtui`) that maps Nothing OS widget colors
(background, accents, media player, settings toggles) to Android's Material
You dynamic color system, so web and React Native apps can compute the exact
colors the `com.nothing.communitywidgets` app shows on a real Nothing phone,
given either a wallpaper seed color or a `material-color-utilities` Theme.

The token-to-resource mapping (e.g. `widgetBg` → `system_neutral1_50` in
light, `system_neutral1_900` in dark) was extracted by decompiling the
`com.nothing.communitywidgets` APK; the palette math that turns a seed color
into the full set of Material You tones follows Android's wallpaper
`ColorScheme` (default TONAL_SPOT style), in two versions: the 2025 spec
(Android 16 QPR1+, the default) and the 2021 spec (Android 14 to 16 QPR0).

On native Android (Kotlin/Java) and Flutter, the OS/framework already
resolves the Material You palette from the live wallpaper — those platforms
only need the token *mapping*, not this package's palette formula. A
generator that emits the mapping as plain data (Android `colors.xml`, JSON)
for those platforms is a planned but not yet built follow-up.

## Build & test

```
npm test            # unit tests (test.js)
npm run verify:apk  # needs local sample/apk-fixtures/, see below
```

`test.js` is unit tests against `index.js`. `scripts/verify-apk-mapping.mjs`
cross-checks `TOKENS` in `index.js` against the real decompiled APK XML in
`sample/apk-fixtures/` (local only, gitignored), using `scripts/token-map.json` as a provenance record
(which resource each token's value came from: decompiled Java refs, resource
refs, or fixture refs).

**Node:** the system Node is 18. A Node 22 build lives at
`.tooling/node-v22.14.0-linux-x64/` (gitignored); prepend its `bin/` to `PATH`
before running `npm`.

## Layout

- `index.js` — the published package. Exports `nothingWidgetColors`,
  `paletteFromSeed`, `withLstar`, the frozen `TOKENS`, and `FALLBACK_SEED`.
  Every input is either reduced to a seed (hex, ARGB number, Theme,
  DynamicScheme → `paletteFromSeed`) or is a complete device palette keyed by
  Android shade (`neutral1[50]`), which is validated; anything else throws.
  `TOKENS` entries are `{ shade: ['neutral1', 50] }` or `{ static: '#hex' }`.
- `index.d.ts` — hand-written TypeScript types, shipped via `types`/`exports`.
  Keep them in sync with `index.js` (token names, input shapes). Theme and
  DynamicScheme inputs are typed by shape, not imported from
  material-color-utilities, so consumers on another version of it still compile. To check:
  `npm pack`, install the tarball plus `typescript` into a scratch project under
  `.tooling/`, and run `tsc --strict` on a file that uses the API.
- `sample/lab/index.html` — browser harness comparing the package's output
  against an independent second implementation of the AOSP palette spec,
  resolving `@android:color/system_*` refs from the real decompiled fixtures.
  The two sides must stay independent (not both reading the package's own
  palette or its `withLstar`) or the comparison is circular and can't catch
  bugs.
- `sample/material-you-to-nothing.mjs` — runnable end-to-end demo: seed →
  `themeFromSourceColor` → `nothingWidgetColors`.
- `scripts/verify-apk-mapping.mjs` + `scripts/token-map.json` — provenance
  verification that every token in `TOKENS` traces back to something actually
  present in the decompiled APK.
- `extracted/` (gitignored, never committed) — raw decompiled APK output.
  `*.xapk` is also gitignored. Never remove these ignores; redistributing
  Nothing's binary/resources would be copyright infringement, unlike the
  derived color values themselves.
- `sample/apk-fixtures/` — 7 of Nothing's decoded XML resource files, used by
  `verify:apk` and the `sample/lab` page. Local only: they're Nothing's
  copyrighted files, so they're gitignored and must never be committed.
  README "APK fixtures" says how to recreate them.

## Conventions & gotchas

- Licence: MIT (`LICENSE`). npm always ships `LICENSE` regardless of `files`.
- Never commit anything from the APK: not `*.xapk`, `extracted/`, or
  `sample/apk-fixtures/`. All three are gitignored.
- Not affiliated with Nothing Technology Limited; keep the README disclaimer
  saying so.
- Palette chromas (accent1/accent2/neutral1/neutral2), from AOSP libmonet and
  frameworks/libs/systemui `ColorScheme`: Android 12 `CorePalette`
  max(48,seed)/16/4/8, Android 13 36/16/4/8, Android 14 to 16 QPR0 (spec
  '2021') 36/16/6/8, Android 16 QPR1+ (spec '2025', libmonet
  `DEFAULT_SPEC_VERSION = SPEC_2025`) 32 light or 26 dark/16/5/8.5, plus tone 99
  of a yellow hue (105-125) = mean of tones 98 and 100. Only 2021 and 2025 are
  implemented. Dark widget backgrounds on a Nothing phone (2026 screenshots)
  measured `#191d19`, which only chroma 5 reproduces, so 2025 is the default.
- The 2021 spec comes from material-color-utilities 0.2.7's `SchemeTonalSpot`.
  The 2025 spec is hand-written in `index.js`, because 0.3.0 doesn't have it and
  0.4.0 can't be imported by plain Node (extensionless imports). test.js checks
  it against `scripts/mcu-2025.json`, generated from 0.4.0 by
  `scripts/make-mcu-2025-fixture.mjs` (needs Node 18's
  `--experimental-specifier-resolution=node`). test.js also checks both specs
  against hand-written chromas, and the lab's reference side hand-writes them
  too; keep both independent of `index.js`.
- `sample/lab` reads the token→resource map from `scripts/token-map.json`;
  don't reintroduce a hard-coded copy. It must be served over HTTP from the
  repo root (`python3 -m http.server`), since it loads `/node_modules/...`.
- The README's Tokens table is written by hand; `test.js` fails if a row
  doesn't match `TOKENS`.
- The in-app preview browser isn't always available. Headless Chrome works as
  a fallback: `google-chrome --headless=new --remote-debugging-port=9333
  --user-data-dir=.tooling/chrome-prof`, then drive it over CDP from Node
  (Node 22 has a global WebSocket).
- Don't `pkill -f` with a pattern that also appears in your own command line;
  it kills the shell running it.
