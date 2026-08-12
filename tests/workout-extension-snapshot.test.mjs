import assert from "node:assert/strict";
import test from "node:test";
import {
  WORKOUT_EXTENSION_APP_ID,
  WORKOUT_EXTENSION_SCHEMA_VERSION,
  WORKOUT_EXTENSION_SNAPSHOT_KEY,
  WORKOUT_EXTENSION_STORAGE_PATH,
  formatLocalDateTime,
  parseWorkoutExtensionSnapshot,
  readWorkoutExtensionSnapshotWith,
} from "../utils/workout-extension-snapshot.js";

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

test("shared-storage contract constants stay aligned with Z-Tally Move 0.2.0", () => {
  assert.equal(WORKOUT_EXTENSION_APP_ID, 1123237);
  assert.equal(WORKOUT_EXTENSION_STORAGE_PATH, "z-tally-move-share.json");
  assert.equal(WORKOUT_EXTENSION_SNAPSHOT_KEY, "counterSnapshot");
  assert.equal(WORKOUT_EXTENSION_SCHEMA_VERSION, 1);
});

test("parses the current result when the extension has never been reset", () => {
  const parsed = parseWorkoutExtensionSnapshot(validSnapshot());
  assert.deepEqual(parsed.currentResult, {
    count: 12,
    updatedAt: 1786525140000,
  });
  assert.equal(parsed.lastResult, null);
});

test("parses object and serialized snapshots with a previous result", () => {
  const raw = validSnapshot({
    lastResult: {
      count: 31,
      resetAt: 1786525000000,
    },
  });
  assert.deepEqual(parseWorkoutExtensionSnapshot(JSON.stringify(raw)), raw);
});

test("keeps a migrated last result with resetAt zero while suppressing fake time", () => {
  const parsed = parseWorkoutExtensionSnapshot(validSnapshot({
    currentResult: { count: 4, updatedAt: 0 },
    lastResult: { count: 27, resetAt: 0 },
  }));
  assert.deepEqual(parsed.lastResult, { count: 27, resetAt: 0 });
  assert.equal(formatLocalDateTime(parsed.currentResult.updatedAt), "");
  assert.equal(formatLocalDateTime(parsed.lastResult.resetAt), "");
});

test("rejects missing, malformed, unsupported, and invalid snapshots", () => {
  const invalidSnapshots = [
    null,
    "",
    "{broken",
    [],
    {},
    validSnapshot({ schemaVersion: 2 }),
    validSnapshot({ sourceApp: "Unknown" }),
    validSnapshot({ currentResult: null }),
    validSnapshot({ currentResult: { count: -1, updatedAt: 1 } }),
    validSnapshot({ currentResult: { count: 1.5, updatedAt: 1 } }),
    validSnapshot({ currentResult: { count: 1, updatedAt: -1 } }),
    validSnapshot({ lastResult: undefined }),
    validSnapshot({ lastResult: { count: 1, resetAt: "now" } }),
  ];
  invalidSnapshots.forEach((snapshot) => {
    assert.equal(parseWorkoutExtensionSnapshot(snapshot), null);
  });
});

test("isolates storage construction, existence, read, and parse failures", () => {
  assert.equal(readWorkoutExtensionSnapshotWith(() => {
    throw new Error("extension is not installed");
  }), null);

  assert.equal(readWorkoutExtensionSnapshotWith(() => ({
    isExisted: () => false,
  })), null);

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

test("reads the persisted snapshot without writing or caching it", () => {
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
  assert.deepEqual(parsed, raw);
  assert.deepEqual(calls, [
    "isExisted",
    ["getItem", "counterSnapshot", null],
  ]);
});

test("formats valid timestamps using the watch-local date and time fields", () => {
  const localTimestamp = new Date(2026, 7, 12, 9, 5, 0, 0).getTime();
  assert.equal(formatLocalDateTime(localTimestamp), "2026-08-12 09:05");
});
