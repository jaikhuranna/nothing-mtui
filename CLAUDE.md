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
into the full set of Material You tones is a from-scratch reimplementation of
AOSP's wallpaper `ColorScheme`, delegated to
`@material/material-color-utilities`'s `CorePalette`.

On native Android (Kotlin/Java) and Flutter, the OS/framework already
resolves the Material You palette from the live wallpaper — those platforms
only need the token *mapping*, not this package's palette formula. A
generator that emits the mapping as plain data (Android `colors.xml`, JSON)
for those platforms is a planned but not yet built follow-up.

## Build & test

```
npm test          # node test.js && node scripts/verify-apk-mapping.mjs
```

`test.js` is unit tests against `index.js`. `scripts/verify-apk-mapping.mjs`
cross-checks `TOKENS` in `index.js` against the real decompiled APK XML in
`sample/apk-fixtures/`, using `scripts/token-map.json` as a provenance record
(which resource each token's value came from: decompiled Java refs, resource
refs, or fixture refs).

**Gotcha:** this dev environment does not have Node/npm preinstalled and the
sandbox blocks `tar` from creating executables (`Cannot mkdir: Operation not
permitted`) even though plain file writes work fine. Workaround: download the
Node tarball with `wget`, then extract it with Python's `tarfile` module
instead of `tar` — that succeeds. A local Node build lives at
`.tooling/node-v22.14.0-linux-x64/` (gitignored); prepend its `bin/` to
`PATH` to get `node`/`npm`.

## Layout

- `index.js` — the published package. Exports `nothingWidgetColors`,
  `paletteFromSeed`, `paletteFromTheme`, `withLstar`, `TOKENS`, `FALLBACKS`.
- `sample/lab/index.html` — browser harness comparing the package's output
  against an independent second implementation of the AOSP palette spec,
  resolving `@android:color/system_*` refs from the real decompiled fixtures.
  The two sides must stay independent (not both reading the package's own
  palette) or the comparison is circular and can't catch palette bugs.
- `sample/material-you-to-nothing.mjs` — runnable end-to-end demo: seed →
  `themeFromSourceColor` → `nothingWidgetColors`.
- `scripts/verify-apk-mapping.mjs` + `scripts/token-map.json` — provenance
  verification that every token in `TOKENS` traces back to something actually
  present in the decompiled APK.
- `extracted/` (gitignored, never committed) — raw decompiled APK output.
  `*.xapk` is also gitignored. Never remove these ignores; redistributing
  Nothing's binary/resources would be copyright infringement, unlike the
  derived color values themselves.

## Conventions & gotchas

- `package.json` says `"license": "MIT"` but no `LICENSE` file exists yet —
  add one before treating the package as actually MIT-licensed.
- Not affiliated with Nothing Technology Limited; keep the README disclaimer
  saying so.
- Palette generation must go through `@material/material-color-utilities`'s
  `CorePalette`/`TonalPalette`, not hand-rolled chroma constants — a prior
  hand-rolled version drifted from AOSP's actual formula (accent2 used the
  content-scheme chroma instead of AOSP's fixed chroma 16).
