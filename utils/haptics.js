import {
  VIBRATOR_SCENE_SHORT_LIGHT,
} from "@zos/sensor";

export const HAPTIC_COUNT = VIBRATOR_SCENE_SHORT_LIGHT;
export const HAPTIC_CONFIRM = VIBRATOR_SCENE_SHORT_LIGHT;

const MIN_HAPTIC_INTERVAL = 80;
let lastHapticAt = 0;

export function playHaptic(vibrator, mode) {
  if (!vibrator) return false;
  const now = Date.now();
  if (now - lastHapticAt < MIN_HAPTIC_INTERVAL) return true;
  try {
    vibrator.stop();
    if (typeof vibrator.getType === "function") {
      try {
        const types = vibrator.getType();
        if (types && Number.isFinite(types.GENTLE_SHORT)) {
          vibrator.start([{ type: types.GENTLE_SHORT }]);
          lastHapticAt = now;
          return true;
        }
      } catch (_error) {}
    }
    vibrator.start({ mode: mode || VIBRATOR_SCENE_SHORT_LIGHT });
    lastHapticAt = now;
    return true;
  } catch (_error) {
    return false;
  }
}

export function stopHaptic(vibrator) {
  if (!vibrator) return;
  try {
    vibrator.stop();
  } catch (_error) {}
}
