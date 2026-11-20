// Expo config plugin: routes volume key presses in MainActivity to the local
// volume-keys module (modules/volume-keys). The module only consumes keys
// while the counter screen has enabled them, so volume works normally elsewhere.
const { withMainActivity } = require('expo/config-plugins');

const MARKER = 'VolumeKeys.handle(event)';

const IMPORTS = ['import android.view.KeyEvent', 'import app.dhikrgeed.volumekeys.VolumeKeys'];

const OVERRIDE = `
  // dhikrgeed: count with the volume keys on the counter screen (plugins/withVolumeKeys.js)
  override fun dispatchKeyEvent(event: KeyEvent): Boolean {
    if (${MARKER}) return true
    return super.dispatchKeyEvent(event)
  }
`;

/** Adds the imports and the dispatchKeyEvent override. Idempotent. */
function addVolumeKeyHook(src) {
  if (src.includes(MARKER)) return src;
  if (/override\s+fun\s+dispatchKeyEvent/.test(src)) {
    throw new Error('withVolumeKeys: MainActivity already overrides dispatchKeyEvent; merge by hand.');
  }
  const pkg = src.match(/^package [^\n]+\n/m);
  if (!pkg) throw new Error('withVolumeKeys: MainActivity has no package line.');
  const missing = IMPORTS.filter((line) => !src.includes(line));
  let out = src.replace(pkg[0], `${pkg[0]}${missing.map((l) => `${l}\n`).join('')}`);
  const end = out.lastIndexOf('}');
  if (end < 0) throw new Error('withVolumeKeys: MainActivity class body not found.');
  out = `${out.slice(0, end).trimEnd()}\n${OVERRIDE}}${out.slice(end + 1)}`;
  return out;
}

function withVolumeKeys(config) {
  return withMainActivity(config, (cfg) => {
    if (cfg.modResults.language !== 'kt') {
      throw new Error('withVolumeKeys: MainActivity must be Kotlin.');
    }
    cfg.modResults.contents = addVolumeKeyHook(cfg.modResults.contents);
    return cfg;
  });
}

module.exports = withVolumeKeys;
module.exports.addVolumeKeyHook = addVolumeKeyHook;
