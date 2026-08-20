export const WORKOUT_EXTENSION_APP_ID = 1123237;
export const WORKOUT_EXTENSION_STORAGE_PATH = "z-tally-move-share.json";
export const WORKOUT_EXTENSION_SNAPSHOT_KEY = "counterSnapshot";
export const WORKOUT_EXTENSION_SCHEMA_VERSION = 1;
export const WORKOUT_EXTENSION_HISTORY_LIMIT = 10;
export const DATE_ORDER_YMD = "YMD";
export const DATE_ORDER_DMY = "DMY";
export const DATE_ORDER_MDY = "MDY";
export const TIME_ORDER_12 = "12";
export const TIME_ORDER_24 = "24";

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

function parseResetResult(value) {
  if (!isRecord(value)) return null;
  if (!isNonNegativeInteger(value.count)) return null;
  if (!isTimestamp(value.resetAt)) return null;
  return {
    count: value.count,
    resetAt: value.resetAt,
  };
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

    const lastResult = parseResetResult(snapshot.lastResult);
    let resetHistory;
    if (Array.isArray(snapshot.resetHistory)) {
      resetHistory = snapshot.resetHistory
        .map(parseResetResult)
        .filter(Boolean)
        .slice(0, WORKOUT_EXTENSION_HISTORY_LIMIT);
    } else {
      resetHistory = lastResult ? [lastResult] : [];
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
      resetHistory,
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

export function formatLocalDate(timestamp, dateOrder = DATE_ORDER_YMD) {
  if (!isTimestamp(timestamp) || timestamp === 0) return "";
  const date = new Date(timestamp);
  const pad = (value) => `${value}`.padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return dateOrder === DATE_ORDER_DMY
    ? `${day}-${month}-${year}`
    : dateOrder === DATE_ORDER_MDY
      ? `${month}-${day}-${year}`
      : `${year}-${month}-${day}`;
}

export function formatLocalTime(timestamp, timeOrder = TIME_ORDER_24) {
  if (!isTimestamp(timestamp) || timestamp === 0) return "";
  const date = new Date(timestamp);
  const pad = (value) => `${value}`.padStart(2, "0");
  const hours = date.getHours();
  if (timeOrder === TIME_ORDER_12) {
    return `${pad(hours % 12 || 12)}:${pad(date.getMinutes())} ${hours < 12 ? "AM" : "PM"}`;
  }
  return `${pad(hours)}:${pad(date.getMinutes())}`;
}

export function formatLocalDateTime(
  timestamp,
  dateOrder = DATE_ORDER_YMD,
  timeOrder = TIME_ORDER_24,
) {
  const dateText = formatLocalDate(timestamp, dateOrder);
  const timeText = formatLocalTime(timestamp, timeOrder);
  return dateText && timeText ? `${dateText} ${timeText}` : "";
}
