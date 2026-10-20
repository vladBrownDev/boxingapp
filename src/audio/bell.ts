import Sound from 'react-native-sound';

/**
 * boxing_bell.mp3 must live as a native bundled resource, not a Metro asset:
 * android/app/src/main/res/raw/boxing_bell.mp3 (Android res naming rules:
 * lowercase + underscores only) and ios/BoxingApp/boxing-bell.mp3 added to
 * the Xcode target's "Copy Bundle Resources" build phase.
 *
 * All native calls are guarded: until the app is natively rebuilt with this
 * dependency linked (a plain JS/Fast-Refresh reload isn't enough), the native
 * module is undefined and would throw — playBell should silently no-op
 * rather than crash the screen.
 */
let bell: Sound | undefined;
let unavailable = false;

try {
  // mixWithOthers: play over Spotify etc. instead of grabbing audio focus
  // (Android) / interrupting the session (iOS), which stops their music.
  Sound.setCategory('Playback', true);
} catch {
  unavailable = true;
}

function loadBell(onLoaded: (sound: Sound) => void) {
  try {
    const sound = new Sound('boxing_bell.mp3', Sound.MAIN_BUNDLE, error => {
      if (error) {
        unavailable = true;
        return;
      }
      bell = sound;
      onLoaded(sound);
    });
  } catch {
    unavailable = true;
  }
}

/** Plays the round-start/round-end bell, restarting it if it's still ringing. */
export function playBell(): void {
  if (unavailable) {
    return;
  }
  if (!bell) {
    loadBell(sound => sound.play());
    return;
  }
  try {
    bell.stop(() => bell?.play());
  } catch {
    unavailable = true;
  }
}
