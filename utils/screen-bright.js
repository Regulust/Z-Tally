import { resetPageBrightTime, setPageBrightTime } from "@zos/display";
import { SCREEN_BRIGHT_OPTIONS, loadState } from "./state";

export function applyScreenBrightTime(duration) {
  const brightTime = SCREEN_BRIGHT_OPTIONS.includes(duration) ? duration : 0;
  try {
    return brightTime > 0
      ? setPageBrightTime({ brightTime })
      : resetPageBrightTime();
  } catch (_error) {
    return -1;
  }
}

export function applyStoredScreenBrightTime() {
  try {
    return applyScreenBrightTime(loadState().screenBrightTime);
  } catch (_error) {
    return applyScreenBrightTime(0);
  }
}
