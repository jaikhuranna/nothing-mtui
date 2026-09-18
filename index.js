// Token mappings lifted from com.nothing.communitywidgets:
//   light — res/values/colors.xml
//   dark  — res/values-night/colors.xml
// Tone tokens reference a Material You palette: { neutral1: {50: '#hex'}, ... }.

// Static approximations of Android system_neutral*/accent* fallbacks, used
// when no palette is supplied. Every tone referenced by TOKENS has an entry.
export const FALLBACKS = {
  neutral1_10: '#0f0f0f',
  neutral1_50: '#e5e5e5',
  neutral1_100: '#cfcfcf',
  neutral1_200: '#b8b8b8',
  neutral1_600: '#565656',
  neutral1_700: '#3f3f3f',
  neutral1_800: '#2c2c2c',
  neutral1_900: '#1b1b1b',
  neutral2_100: '#e0e0e0',
  neutral2_300: '#9e9e9e',
  neutral2_600: '#565656',
  accent1_100: '#dfdfdf',
  accent1_600: '#565656',
  accent2_100: '#e0e0e0',
  accent2_700: '#3f3f3f',
};

export const TOKENS = {
  light: {
    widgetBg: { tone: ['neutral1', 50] },
    settingsBg: { tone: ['neutral1', 50] },
    widgetElements: { static: '#000000' },
    widgetFood: { static: '#d71921' },
    widgetIcon: { static: '#ffffff' },
    mediaPageIndicator: { tone: ['neutral1', 200] },
    mediaPageIndicatorSelected: { tone: ['neutral1', 800] },
    mediaText: { tone: ['neutral1', 900] },
    mediaProgress: { tone: ['neutral1', 900] },
    mediaProgressBg: { tone: ['neutral1', 100] },
    mediaSwitchIcon: { tone: ['neutral1', 900] },
    mediaSwitchIconBg: { tone: ['neutral1', 100] },
    settingsAccent: { tone: ['accent1', 600] },
    settingsStateOn: { tone: ['accent1', 100] },
    settingsStateOff: { tone: ['accent2', 100] },
    settingsThumbOff: { tone: ['neutral2', 100] },
    settingsTrackOff: { tone: ['neutral2', 600] },
    settingsTrackOn: { tone: ['accent1', 600] },
  },
  dark: {
    widgetBg: { tone: ['neutral1', 900] },
    // widget_settings_bg dark = neutral1_900 with lStar=12; plain tone 900 is the closest expressible
    settingsBg: { tone: ['neutral1', 900] },
    widgetElements: { static: '#ffffff' },
    widgetFood: { static: '#d71921' },
    widgetIcon: { static: '#ffffff' },
    mediaPageIndicator: { tone: ['neutral1', 600] },
    mediaPageIndicatorSelected: { tone: ['neutral1', 10] },
    mediaText: { tone: ['neutral1', 50] },
    mediaProgress: { tone: ['neutral1', 50] },
    mediaProgressBg: { tone: ['neutral1', 800] },
    mediaSwitchIcon: { tone: ['neutral1', 50] },
    mediaSwitchIconBg: { tone: ['neutral1', 800] },
    settingsAccent: { tone: ['accent1', 100] },
    // not overridden in values-night: same tones resolve against the dark palette
    settingsStateOn: { tone: ['accent1', 100] },
    settingsStateOff: { tone: ['accent2', 100] },
    settingsThumbOff: { tone: ['neutral2', 300] },
    settingsTrackOff: { tone: ['neutral1', 700] },
    settingsTrackOn: { tone: ['accent2', 700] },
  },
};

export function nothingWidgetColors(palette, mode = 'light') {
  const tokens = TOKENS[mode];
  if (!tokens) throw new Error(`unknown mode: ${mode}`);
  const out = {};
  for (const [name, token] of Object.entries(tokens)) {
    if (token.static !== undefined) {
      out[name] = token.static;
      continue;
    }
    const [key, tone] = token.tone;
    out[name] = palette?.[key]?.[tone] ?? FALLBACKS[`${key}_${tone}`];
  }
  return out;
}
