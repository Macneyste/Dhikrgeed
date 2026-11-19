// Expo config plugin: release builds get no INTERNET permission.
//
// Expo's template adds INTERNET to the main manifest because development
// builds need it to reach Metro. Dhikrgeed makes no network calls, so:
//   - main manifest: INTERNET is marked tools:node="remove";
//   - debug manifests: INTERNET is declared again. Build-type manifests have a
//     higher merge priority than main, so debug builds keep it.
const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

const INTERNET = 'android.permission.INTERNET';

function withoutInternetInMain(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$['xmlns:tools'] = manifest.$['xmlns:tools'] || 'http://schemas.android.com/tools';
    const perms = (manifest['uses-permission'] = manifest['uses-permission'] || []);
    const existing = perms.find((p) => p.$['android:name'] === INTERNET);
    if (existing) existing.$['tools:node'] = 'remove';
    else perms.push({ $: { 'android:name': INTERNET, 'tools:node': 'remove' } });
    return cfg;
  });
}

function withInternetInDebug(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      for (const variant of ['debug', 'debugOptimized']) {
        const file = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src', variant, 'AndroidManifest.xml');
        if (!fs.existsSync(file)) continue;
        const xml = fs.readFileSync(file, 'utf8');
        if (xml.includes(INTERNET)) continue;
        fs.writeFileSync(
          file,
          xml.replace(/(<manifest[^>]*>)/, `$1\n    <uses-permission android:name="${INTERNET}"/>`),
        );
      }
      return cfg;
    },
  ]);
}

module.exports = function withNoInternetInRelease(config) {
  return withInternetInDebug(withoutInternetInMain(config));
};
