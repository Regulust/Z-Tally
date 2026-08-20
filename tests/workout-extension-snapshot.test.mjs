import assert from "node:assert/strict";
import test from "node:test";
import {
  DATE_ORDER_DMY,
  DATE_ORDER_MDY,
  DATE_ORDER_YMD,
  TIME_ORDER_12,
  TIME_ORDER_24,
  WORKOUT_EXTENSION_APP_ID,
  WORKOUT_EXTENSION_HISTORY_LIMIT,
  WORKOUT_EXTENSION_SCHEMA_VERSION,
  WORKOUT_EXTENSION_SNAPSHOT_KEY,
  WORKOUT_EXTENSION_STORAGE_PATH,
  formatLocalDate,
  formatLocalDateTime,
  formatLocalTime,
  parseWorkoutExtensionSnapshot,
  readWorkoutExtensionSnapshotWith,
} from "../utils/workout-extension-snapshot.js";
import {
  dateOrderFromSystem,
  historyCountTextSize,
  resetTimeLines,
  timeOrderFromSystem,
} from "../utils/workout-extension-view.js";

function validSnapshot(overrides = {}) {
  return {
    schemaVersion: 1,
    sourceApp: "Z-Tally Move",
    publishedAt: 1786525200000,
    currentResult: {
      count: 12,
      updatedAt: 1786525140000,
    },
    lastResult: null,
    ...overrides,
  };
}

function historyOf(length) {
  return Array.from({ length }, (_, index) => ({
    count: 1000 + index,
    resetAt: 1786525000000 - index * 60000,
  }));
}

test("shared-storage contract constants stay aligned with Z-Tally Move 1.0.0", () => {
  assert.equal(WORKOUT_EXTENSION_APP_ID, 1123237);
  assert.equal(WORKOUT_EXTENSION_STORAGE_PATH, "z-tally-move-share.json");
  assert.equal(WORKOUT_EXTENSION_SNAPSHOT_KEY, "counterSnapshot");
  assert.equal(WORKOUT_EXTENSION_SCHEMA_VERSION, 1);
  assert.equal(WORKOUT_EXTENSION_HISTORY_LIMIT, 10);
});

test("parses an old snapshot with no previous result as empty history", () => {
  const parsed = parseWorkoutExtensionSnapshot(validSnapshot());
  assert.deepEqual(parsed.currentResult, {
    count: 12,
    updatedAt: 1786525140000,
  });
  assert.equal(parsed.lastResult, null);
  assert.deepEqual(parsed.resetHistory, []);
});

test("derives one history row from lastResult for Move 0.2.0 and 0.2.1", () => {
  const lastResult = { count: 31, resetAt: 1786525000000 };
  const parsed = parseWorkoutExtensionSnapshot(JSON.stringify(validSnapshot({ lastResult })));
  assert.deepEqual(parsed.lastResult, lastResult);
  assert.deepEqual(parsed.resetHistory, [lastResult]);
});

test("accepts 0, 1, 5, and 10 reset-history rows newest first", () => {
  for (const length of [0, 1, 5, 10]) {
    const resetHistory = historyOf(length);
    const parsed = parseWorkoutExtensionSnapshot(validSnapshot({
      lastResult: resetHistory[0] || null,
      resetHistory,
    }));
    assert.deepEqual(parsed.resetHistory, resetHistory);
  }
});

test("tolerates future 11-row and 20-row arrays and shows only the newest 10", () => {
  for (const length of [11, 20]) {
    const resetHistory = historyOf(length);
    const parsed = parseWorkoutExtensionSnapshot(validSnapshot({
      lastResult: resetHistory[0],
      resetHistory,
    }));
    assert.equal(parsed.resetHistory.length, 10);
    assert.deepEqual(parsed.resetHistory, resetHistory.slice(0, 10));
  }
});

test("drops malformed history entries individually before applying the limit", () => {
  const validRows = historyOf(12);
  const resetHistory = [
    validRows[0],
    null,
    { count: -1, resetAt: 1 },
    validRows[1],
    { count: 3, resetAt: "now" },
    ...validRows.slice(2),
  ];
  const parsed = parseWorkoutExtensionSnapshot(validSnapshot({
    lastResult: validRows[0],
    resetHistory,
  }));
  assert.deepEqual(parsed.resetHistory, validRows.slice(0, 10));
});

test("falls back to lastResult when resetHistory is malformed as a whole", () => {
  const lastResult = { count: 44, resetAt: 1786525000000 };
  for (const resetHistory of [null, {}, "broken", 10]) {
    const parsed = parseWorkoutExtensionSnapshot(validSnapshot({ lastResult, resetHistory }));
    assert.deepEqual(parsed.currentResult, { count: 12, updatedAt: 1786525140000 });
    assert.deepEqual(parsed.resetHistory, [lastResult]);
  }
});

test("history damage never hides a valid current result", () => {
  const parsed = parseWorkoutExtensionSnapshot(validSnapshot({
    lastResult: { count: "bad", resetAt: -1 },
    resetHistory: [null, {}, { count: -1, resetAt: 1 }],
  }));
  assert.deepEqual(parsed.currentResult, { count: 12, updatedAt: 1786525140000 });
  assert.equal(parsed.lastResult, null);
  assert.deepEqual(parsed.resetHistory, []);
});

test("keeps resetAt zero results while suppressing unknown date and time", () => {
  const parsed = parseWorkoutExtensionSnapshot(validSnapshot({
    currentResult: { count: 4, updatedAt: 0 },
    lastResult: { count: 27, resetAt: 0 },
    resetHistory: [{ count: 27, resetAt: 0 }],
  }));
  assert.deepEqual(parsed.resetHistory, [{ count: 27, resetAt: 0 }]);
  assert.equal(formatLocalDateTime(parsed.currentResult.updatedAt), "");
  assert.equal(formatLocalDate(parsed.resetHistory[0].resetAt), "");
  assert.equal(formatLocalTime(parsed.resetHistory[0].resetAt), "");
});

test("rejects missing, malformed, unsupported, and invalid base snapshots", () => {
  const invalidSnapshots = [
    null,
    "",
    "{broken",
    [],
    {},
    validSnapshot({ schemaVersion: 2 }),
    validSnapshot({ sourceApp: "Unknown" }),
    validSnapshot({ publishedAt: -1 }),
    validSnapshot({ currentResult: null }),
    validSnapshot({ currentResult: { count: -1, updatedAt: 1 } }),
    validSnapshot({ currentResult: { count: 1.5, updatedAt: 1 } }),
    validSnapshot({ currentResult: { count: 1, updatedAt: -1 } }),
  ];
  invalidSnapshots.forEach((snapshot) => {
    assert.equal(parseWorkoutExtensionSnapshot(snapshot), null);
  });
});

test("isolates storage construction, existence, read, and parse failures", () => {
  assert.equal(readWorkoutExtensionSnapshotWith(() => {
    throw new Error("extension is not installed");
  }), null);
  assert.equal(readWorkoutExtensionSnapshotWith(() => ({ isExisted: () => false })), null);
  assert.equal(readWorkoutExtensionSnapshotWith(() => ({
    isExisted: () => { throw new Error("existence check failed"); },
  })), null);
  assert.equal(readWorkoutExtensionSnapshotWith(() => ({
    isExisted: () => true,
    getItem: () => { throw new Error("read failed"); },
  })), null);
  assert.equal(readWorkoutExtensionSnapshotWith(() => ({
    isExisted: () => true,
    getItem: () => "not json",
  })), null);
});

test("reads the shared snapshot without writing or caching it", () => {
  const raw = validSnapshot({ lastResult: { count: 8, resetAt: 0 } });
  const calls = [];
  const parsed = readWorkoutExtensionSnapshotWith(() => ({
    isExisted() {
      calls.push("isExisted");
      return true;
    },
    getItem(key, fallback) {
      calls.push(["getItem", key, fallback]);
      return raw;
    },
    setItem() {
      calls.push("setItem");
      throw new Error("read-only contract violation");
    },
  }));
  assert.deepEqual(parsed.resetHistory, [{ count: 8, resetAt: 0 }]);
  assert.deepEqual(calls, ["isExisted", ["getItem", "counterSnapshot", null]]);
});

test("formats complete dates in YMD, DMY, and MDY and times in 12/24-hour form", () => {
  const morning = new Date(2026, 7, 12, 9, 5, 0, 0).getTime();
  const evening = new Date(2026, 7, 12, 21, 5, 0, 0).getTime();
  assert.equal(formatLocalDate(morning, DATE_ORDER_YMD), "2026-08-12");
  assert.equal(formatLocalDate(morning, DATE_ORDER_DMY), "12-08-2026");
  assert.equal(formatLocalDate(morning, DATE_ORDER_MDY), "08-12-2026");
  assert.equal(formatLocalTime(morning, TIME_ORDER_24), "09:05");
  assert.equal(formatLocalTime(morning, TIME_ORDER_12), "09:05 AM");
  assert.equal(formatLocalTime(evening, TIME_ORDER_12), "09:05 PM");
  assert.equal(formatLocalDateTime(morning, DATE_ORDER_DMY, TIME_ORDER_12), "12-08-2026 09:05 AM");
  assert.equal(formatLocalDate(morning, "unsupported"), "2026-08-12");
  assert.equal(formatLocalTime(morning, "unsupported"), "09:05");
});

test("view helpers provide safe system-format fallbacks and long-number sizing", () => {
  assert.equal(dateOrderFromSystem(1, 1, 2), DATE_ORDER_DMY);
  assert.equal(dateOrderFromSystem(2, 1, 2), DATE_ORDER_MDY);
  assert.equal(dateOrderFromSystem(undefined, 1, 2), DATE_ORDER_YMD);
  assert.equal(timeOrderFromSystem(0, 0), TIME_ORDER_12);
  assert.equal(timeOrderFromSystem(undefined, 0), TIME_ORDER_24);
  assert.deepEqual(resetTimeLines(0, DATE_ORDER_YMD, TIME_ORDER_24), { date: "", time: "" });
  assert.ok(historyCountTextSize(1234) > historyCountTextSize(12345678901));
  assert.ok(historyCountTextSize(1234, true) > historyCountTextSize(12345678901, true));
});
