import { LocalStorage } from "@zos/share-storage";
import {
  WORKOUT_EXTENSION_APP_ID,
  WORKOUT_EXTENSION_STORAGE_PATH,
  readWorkoutExtensionSnapshotWith,
} from "./workout-extension-snapshot";

export function readWorkoutExtensionSnapshot() {
  return readWorkoutExtensionSnapshotWith(
    () => new LocalStorage(WORKOUT_EXTENSION_APP_ID, WORKOUT_EXTENSION_STORAGE_PATH),
  );
}
