# Performance on low-end Android

Targets (Phase 2, §3.5):

| Target | Goal |
| --- | --- |
| Device | Smooth on a phone with 2 GB RAM |
| Tap to count | Under 100 ms from touch to the new number on screen |
| APK size | Under 20 MB (release, universal APK) |

Only record numbers measured on a real device with a **release** build. Do not estimate.

## What has been done

- Tree draws from its growth stage only (`TreeArt` is memoized), so taps within a stage do not re-render its SVG.
- `Bead`, `TasbihString` and `FallingBead` are memoized; falling beads use the native driver and are skipped when "Dhaqdhaqaaq yar" is on.
- Release builds use R8 minification and resource shrinking (`expo-build-properties`). Hermes is on.
- Amiri Bold is subset: 395 KB → 281 KB (measured on the font file with `npm run fonts:subset`).

## How to measure

1. Build a release APK: `npx expo prebuild --platform android` then `cd android && ./gradlew assembleRelease` (or the EAS `preview` profile once `eas.json` exists).
2. **APK size:** `ls -l android/app/build/outputs/apk/release/*.apk`.
3. **Tap to count:** record the screen at 60 fps or more (`adb shell screenrecord --bit-rate 8000000 /sdcard/tap.mp4`) with *Settings → Developer options → Show taps* on. Tap 20 times with pauses; for each tap count the frames from the touch dot appearing to the number changing. Report the median and the worst.
4. **Smoothness:** `adb shell dumpsys gfxinfo app.dhikrgeed reset`, count 100 taps on Tasbiix, then `adb shell dumpsys gfxinfo app.dhikrgeed` and record "Janky frames" and the 90th/99th percentile frame times.
5. **Memory:** `adb shell dumpsys meminfo app.dhikrgeed` after 100 taps; record "TOTAL PSS".

## Results

No device measurements yet.

| Date | Device (RAM, Android) | Build | APK size | Tap→count median / worst | Janky frames | P90 / P99 frame | PSS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | |
