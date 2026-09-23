import { existsSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { TOKENS } from '../index.js';

const R = 'sample/apk-fixtures';
if (!existsSync(`${R}/values/colors.xml`)) {
  console.error(`No APK fixtures in ${R}/. They're Nothing's files, so they aren't committed; see "APK fixtures" in the README to decode them locally.`);
  process.exit(1);
}
const read = f => readFileSync(`${R}/${f}`, 'utf8');

const parseColors = xml => Object.fromEntries(
  [...xml.matchAll(/<color name="([^"]+)">(.*?)<\/color>/g)].map(([, n, v]) => [n, v.trim()]));

const base = parseColors(read('values/colors.xml'));
const night = parseColors(read('values-night/colors.xml'));
const colorXml = read('color/default_color_background_dark.xml');
const tokenMap = JSON.parse(readFileSync('scripts/token-map.json', 'utf8'));

// Cross-check: every token's resource must be referenced by decompiled code,
// decompiled resources, or committed fixtures. `declared_only` tokens are
// exempt but must still be declared in colors.xml, and are reported below so
// the exemption stays visible rather than silently absorbing a typo.
const declaredOnly = [];
for (const [token, v] of Object.entries(tokenMap.tokens)) {
  const refs = (v.java_refs?.length ?? 0) + (v.res_refs?.length ?? 0) + (v.fixture_refs?.length ?? 0);
  if (v.declared_only === true) {
    assert.ok(refs === 0, `${token}: marked declared_only but has ${refs} refs`);
    assert.ok(v.res in base, `${token}: declared_only but ${v.res} is not in values/colors.xml`);
    declaredOnly.push(token);
    continue;
  }
  assert.ok(refs > 0, `${token}: unproven resource reference`);
}

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
      const itemTag = colorXml.match(/<item[^>]*>/)[0];
      const item = itemTag.match(/android:color="([^"]+)"/)[1];
      const lstar = itemTag.match(/android:lStar="([\d.]+)"/);
      const out = extract(item, mode, seen);
      if (lstar) out.lstar = Number(lstar[1]);
      return out;
    }
    const table = mode === 'dark' ? { ...base, ...night } : base;
    assert.ok(name in table, `missing resource: ${name}`);
    return extract(table[name], mode, seen);
  }
  return { static: value };
}

const TOKEN_TO_RES = Object.fromEntries(
  Object.entries(tokenMap.tokens).map(([token, v]) => [token, v.res]));

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
console.log(`ok: package TOKENS match APK XML extraction (incl. lStar), provenance verified`);
console.log(`declared-only (no code/resource reference found): ${declaredOnly.join(', ') || 'none'}`);
