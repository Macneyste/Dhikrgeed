import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { addVolumeKeyHook } = require('../../plugins/withVolumeKeys.js') as {
  addVolumeKeyHook(src: string): string;
};

const ACTIVITY = `package app.dhikrgeed
import android.os.Bundle

import com.facebook.react.ReactActivity

class MainActivity : ReactActivity() {
  override fun getMainComponentName(): String = "main"
}
`;

test('adds imports and a dispatchKeyEvent override that defers to VolumeKeys', () => {
  const out = addVolumeKeyHook(ACTIVITY);
  assert.match(
    out,
    /^package app\.dhikrgeed\nimport android\.view\.KeyEvent\nimport app\.dhikrgeed\.volumekeys\.VolumeKeys\n/,
  );
  assert.match(
    out,
    /override fun dispatchKeyEvent\(event: KeyEvent\): Boolean \{\n\s+if \(VolumeKeys\.handle\(event\)\) return true\n\s+return super\.dispatchKeyEvent\(event\)/,
  );
  // The override sits inside the class body.
  assert.ok(out.trimEnd().endsWith('}\n}') || out.trimEnd().endsWith('}'));
  assert.equal(out.match(/class MainActivity/g)?.length, 1);
});

test('is idempotent', () => {
  const once = addVolumeKeyHook(ACTIVITY);
  assert.equal(addVolumeKeyHook(once), once);
});

test('refuses to overwrite an existing dispatchKeyEvent override', () => {
  const custom = ACTIVITY.replace(
    'override fun getMainComponentName',
    'override fun dispatchKeyEvent(event: KeyEvent): Boolean = false\n  override fun getMainComponentName',
  );
  assert.throws(() => addVolumeKeyHook(custom), /already overrides dispatchKeyEvent/);
});
