import {
  VIBRATOR_SCENE_SHORT_LIGHT,
  VIBRATOR_SCENE_SHORT_MIDDLE,
} from "@zos/sensor";

export const HAPTIC_COUNT = VIBRATOR_SCENE_SHORT_MIDDLE;
export const HAPTIC_CONFIRM = VIBRATOR_SCENE_SHORT_LIGHT;

export function playHaptic(vibrator, mode) {
  if (!vibrator) return false;
  try {
    vibrator.stop();
    vibrator.start({ mode });
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
