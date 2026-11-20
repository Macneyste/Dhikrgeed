package app.dhikrgeed.volumekeys

import android.view.KeyEvent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Volume key routing for the counter screen.
 *
 * MainActivity.dispatchKeyEvent calls [handle] (added by plugins/withVolumeKeys.js).
 * Keys are only consumed while JS has enabled counting AND is listening, so the
 * system volume works normally everywhere else. Only the foreground activity
 * receives key events, so nothing is counted in the background.
 */
object VolumeKeys {
  @Volatile internal var enabled = false
  @Volatile internal var listener: ((String) -> Unit)? = null

  /** Returns true when the event was consumed (the system volume must not change). */
  @JvmStatic
  fun handle(event: KeyEvent): Boolean {
    if (!enabled) return false
    val emit = listener ?: return false
    val key = when (event.keyCode) {
      KeyEvent.KEYCODE_VOLUME_DOWN -> "down"
      KeyEvent.KEYCODE_VOLUME_UP -> "up"
      else -> return false
    }
    // One count per press: ignore auto-repeat while the key is held, and
    // swallow ACTION_UP too so the volume panel never appears.
    if (event.action == KeyEvent.ACTION_DOWN && event.repeatCount == 0) emit(key)
    return true
  }

  internal fun clear() {
    enabled = false
    listener = null
  }
}

class VolumeKeysModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VolumeKeys")

    Events("onVolumeKey")

    OnStartObserving("onVolumeKey") {
      VolumeKeys.listener = { key -> sendEvent("onVolumeKey", mapOf("key" to key)) }
    }

    OnStopObserving("onVolumeKey") {
      VolumeKeys.clear()
    }

    Function("setEnabled") { enabled: Boolean ->
      VolumeKeys.enabled = enabled
    }

    OnDestroy {
      VolumeKeys.clear()
    }
  }
}
