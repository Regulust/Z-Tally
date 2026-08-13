export const WORKOUT_EXTENSION_APP_ID = 1123237;
export const WORKOUT_EXTENSION_STORAGE_PATH = "z-tally-move-share.json";
export const WORKOUT_EXTENSION_SNAPSHOT_KEY = "counterSnapshot";
export const WORKOUT_EXTENSION_SCHEMA_VERSION = 1;
export const DATE_ORDER_YMD = "YMD";
export const DATE_ORDER_DMY = "DMY";
export const DATE_ORDER_MDY = "MDY";

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonNegativeInteger(value) {
  return typeof value === "number"
    && Number.isFinite(value)
    && value >= 0
    && Math.floor(value) === value;
}

function isTimestamp(value) {
  if (!isNonNegativeInteger(value)) return false;
  const date = new Date(value);
  return date.getTime() === date.getTime();
}

function parseRawSnapshot(rawSnapshot) {
  if (typeof rawSnapshot !== "string") return rawSnapshot;
  return JSON.parse(rawSnapshot);
}

export function parseWorkoutExtensionSnapshot(rawSnapshot) {
  try {
    const snapshot = parseRawSnapshot(rawSnapshot);
    if (!isRecord(snapshot)) return null;
    if (snapshot.schemaVersion !== WORKOUT_EXTENSION_SCHEMA_VERSION) return null;
    if (snapshot.sourceApp !== "Z-Tally Move") return null;
    if (!isTimestamp(snapshot.publishedAt)) return null;
    if (!isRecord(snapshot.currentResult)) return null;
    if (!isNonNegativeInteger(snapshot.currentResult.count)) return null;
    if (!isTimestamp(snapshot.currentResult.updatedAt)) return null;

    let lastResult = null;
    if (snapshot.lastResult !== null) {
      if (!isRecord(snapshot.lastResult)) return null;
      if (!isNonNegativeInteger(snapshot.lastResult.count)) return null;
      if (!isTimestamp(snapshot.lastResult.resetAt)) return null;
      lastResult = {
        count: snapshot.lastResult.count,
        resetAt: snapshot.lastResult.resetAt,
      };
    }

    return {
      schemaVersion: WORKOUT_EXTENSION_SCHEMA_VERSION,
      sourceApp: "Z-Tally Move",
      publishedAt: snapshot.publishedAt,
      currentResult: {
        count: snapshot.currentResult.count,
        updatedAt: snapshot.currentResult.updatedAt,
      },
      lastResult,
    };
  } catch (_error) {
    return null;
  }
}

export function readWorkoutExtensionSnapshotWith(createStorage) {
  let storage;
  try {
    storage = createStorage();
  } catch (_error) {
    return null;
  }

  let storageExists;
  try {
    storageExists = Boolean(storage && storage.isExisted());
  } catch (_error) {
    return null;
  }
  if (!storageExists) return null;

  let rawSnapshot;
  try {
    rawSnapshot = storage.getItem(WORKOUT_EXTENSION_SNAPSHOT_KEY, null);
  } catch (_error) {
    return null;
  }

  try {
    return parseWorkoutExtensionSnapshot(rawSnapshot);
  } catch (_error) {
    return null;
  }
}

export function formatLocalDateTime(timestamp, dateOrder = DATE_ORDER_YMD) {
  if (!isTimestamp(timestamp) || timestamp === 0) return "";
  const date = new Date(timestamp);
  const pad = (value) => `${value}`.padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const dateText = dateOrder === DATE_ORDER_DMY
    ? `${day}-${month}-${year}`
    : dateOrder === DATE_ORDER_MDY
      ? `${month}-${day}-${year}`
      : `${year}-${month}-${day}`;
  return `${dateText} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
