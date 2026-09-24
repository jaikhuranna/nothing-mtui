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
into the full set of Material You tones follows Android 14–16's wallpaper
`ColorScheme`, which builds its palettes with
`@material/material-color-utilities`'s `SchemeTonalSpot`.

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
  `paletteFromSeed`, `withLstar`, and the frozen `TOKENS` / `FALLBACKS`.
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
- Palette generation goes through `SchemeTonalSpot`, which is what Android
  14–16 use. Chromas by version (accent1/accent2/neutral1/neutral2): Android 12
  `CorePalette` max(48,seed)/16/4/8, Android 13 36/16/4/8, Android 14+
  36/16/6/8. `test.js` checks the 14+ numbers against hand-written constants,
  and the lab's reference side hand-writes them too; keep both independent of
  `index.js`.
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
