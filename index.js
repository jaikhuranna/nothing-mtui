export const NEUTRAL = 'neutral1';
export const NEUTRAL2 = 'neutral2';
export const ACCENT1 = 'accent1';
export const ACCENT2 = 'accent2';

// Static fallbacks approximating Android system_neutral1/accent1 when no
// Material You palette is available (non-dynamic device or web).
export const FALLBACKS = {
  light: {
    neutral1_50: '#e5e5e5',
    neutral1_100: '#cfcfcf',
    neutral1_200: '#b8b8b8',
    neutral1_800: '#2c2c2c',
    neutral1_900: '#1b1b1b',
    accent1_600: '#565656',
    accent2_100: '#e0e0e0',
    neutral2_100: '#e0e0e0',
    neutral2_600: '#565656',
  },
  dark: {
    neutral1_50: '#e5e5e5',
    neutral1_100: '#cfcfcf',
    neutral1_200: '#b8b8b8',
    neutral1_800: '#2c2c2c',
    neutral1_900: '#1b1b1b',
    accent1_600: '#a9a9a9',
    accent2_100: '#2c2c2c',
    neutral2_100: '#2c2c2c',
    neutral2_600: '#a9a9a9',
  },
};

// Mapping lifted from res/values/colors.xml of com.nothing.communitywidgets.
// tone: [paletteKey, toneValue]
export const TOKENS = {
  light: {
    widgetBg: { tone: ['neutral1', 50] },
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
    widgetElements: { static: '#ffffff' },
    widgetFood: { static: '#d71921' },
    widgetIcon: { static: '#ffffff' },
    mediaPageIndicator: { tone: ['neutral1', 200] },
    mediaPageIndicatorSelected: { tone: ['neutral1', 800] },
    mediaText: { tone: ['neutral1', 100] },
    mediaProgress: { tone: ['neutral1', 100] },
    mediaProgressBg: { tone: ['neutral1', 800] },
    mediaSwitchIcon: { tone: ['neutral1', 100] },
    mediaSwitchIconBg: { tone: ['neutral1', 800] },
    settingsAccent: { tone: ['accent1', 600] },
    settingsStateOn: { tone: ['accent1', 800] },
    settingsStateOff: { tone: ['accent2', 800] },
    settingsThumbOff: { tone: ['neutral2', 800] },
    settingsTrackOff: { tone: ['neutral2', 400] },
    settingsTrackOn: { tone: ['accent1', 600] },
  },
};

// palette shape: { neutral1: {50: '#hex', ...}, neutral2: {...}, accent1: {...}, accent2: {...} }
export function nothingWidgetColors(palette, mode = 'light') {
  const tokens = TOKENS[mode] ?? TOKENS.light;
  const fallbacks = FALLBACKS[mode] ?? FALLBACKS.light;
  const out = {};
  for (const [name, token] of Object.entries(tokens)) {
    if (token.static !== undefined) {
      out[name] = token.static;
      continue;
    }
    const [key, tone] = token.tone;
    out[name] = palette?.[key]?.[tone] ?? fallbacks[`${key}_${tone}`] ?? fallbacks[`neutral1_${tone}`];
  }
  return out;
}
