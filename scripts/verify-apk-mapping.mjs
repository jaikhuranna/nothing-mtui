import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { TOKENS } from '../index.js';

const R = 'sample/apk-fixtures';
const read = f => readFileSync(`${R}/${f}`, 'utf8');

const parseColors = xml => Object.fromEntries(
  [...xml.matchAll(/<color name="([^"]+)">(.*?)<\/color>/g)].map(([, n, v]) => [n, v.trim()]));

const base = parseColors(read('values/colors.xml'));
const night = parseColors(read('values-night/colors.xml'));
const colorXml = read('color/default_color_background_dark.xml');

// token -> APK resource name, transcribed from decompiled Java call sites
// (SnakeGameView.java:258-267, NTPageIndicatorDot attrs, quotes/mediaplayer layouts)
const TOKEN_TO_RES = {
  widgetBg: 'widget_bg_color',
  settingsBg: 'widget_settings_bg',
  widgetElements: 'widget_elements_color',
  widgetFood: 'widget_food_color',
  widgetIcon: 'widget_icon_color',
  mediaPageIndicator: 'color_media_page_indicator_default',
  mediaPageIndicatorSelected: 'color_media_page_indicator_selected',
  mediaText: 'color_text_enable_authorize_tips',
  mediaProgress: 'color_music_progress_bar',
  mediaProgressBg: 'color_music_progress_bar_bg',
  mediaSwitchIcon: 'color_media_switch_icon',
  mediaSwitchIconBg: 'color_media_switch_icon_bg',
  settingsAccent: 'home_settings_header_accent',
  settingsStateOn: 'home_settings_state_on_color',
  settingsStateOff: 'home_settings_state_off_color',
  settingsThumbOff: 'home_settings_thumb_off_color',
  settingsTrackOff: 'home_settings_track_off_color',
  settingsTrackOn: 'home_settings_track_on_color',
};

function extract(value, mode, seen = new Set()) {
  assert.ok(!seen.has(value + mode), `cycle: ${value}`);
  seen.add(value + mode);
  if (value.startsWith('@android:color/')) {
    const sys = value.slice('@android:color/'.length);
    if (sys === 'white') return { static: '#ffffff' };
    if (sys === 'black') return { static: '#000000' };
    const m = sys.match(/^system_(neutral1|neutral2|accent1|accent2)_(\d+)$/);
    assert.ok(m, `unhandled system color: ${sys}`);
    return { tone: [m[1], Number(m[2])] };
  }
  if (value.startsWith('@color/')) {
    const name = value.slice('@color/'.length);
    if (name === 'default_color_background_dark') {
      // selector item carries android:lStar="12"; ignored, tone 900 neutral already sits at L*~12
      const item = colorXml.match(/android:color="([^"]+)"/)[1];
      return extract(item, mode, seen);
    }
    const table = mode === 'dark' ? { ...base, ...night } : base;
    assert.ok(name in table, `missing resource: ${name}`);
    return extract(table[name], mode, seen);
  }
  return { static: value };
}

let fails = 0;
for (const mode of ['light', 'dark']) {
  for (const [token, res] of Object.entries(TOKEN_TO_RES)) {
    const table = mode === 'dark' ? { ...base, ...night } : base;
    const expected = extract(table[res], mode);
    const actual = TOKENS[mode][token];
    const ok = JSON.stringify(expected) === JSON.stringify(actual);
    if (!ok) {
      fails++;
      console.log(`FAIL ${mode} ${token}: xml=${JSON.stringify(expected)} package=${JSON.stringify(actual)}`);
    }
  }
}
assert.equal(Object.keys(TOKENS.light).length, Object.keys(TOKEN_TO_RES).length, 'token set drift');
assert.equal(Object.keys(TOKENS.dark).length, Object.keys(TOKEN_TO_RES).length, 'token set drift');
assert.equal(fails, 0, `${fails} token mappings differ from APK XML`);
console.log('ok: package TOKENS match APK XML extraction, both modes');
