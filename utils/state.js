import { LocalStorage } from "@zos/storage";

export const STORAGE_KEY = "z-tally-state";
export const HISTORY_LIMIT = 30;
export const SCREEN_BRIGHT_OPTIONS = [0, 15000, 30000, 60000];
export const COUNTER_IDS = ["counter-1", "counter-2", "counter-3"];

export function createDefaultState() {
  return {
    schemaVersion: 1,
    activeCounterId: COUNTER_IDS[0],
    vibrationEnabled: true,
    screenBrightTime: 0,
    counters: COUNTER_IDS.map((id) => ({ id, value: 0 })),
    results: [],
  };
}

function legacyCounterId(item) {
  if (COUNTER_IDS.includes(item.counterId)) return item.counterId;
  const match = typeof item.counterName === "string" && item.counterName.match(/(\d)$/);
  const index = match ? Number(match[1]) - 1 : -1;
  return COUNTER_IDS[index] || COUNTER_IDS[0];
}

export function normalizeState(candidate) {
  const fallback = createDefaultState();
  if (!candidate || candidate.schemaVersion !== 1) return fallback;
  if (!Array.isArray(candidate.counters) || candidate.counters.length !== 3) return fallback;

  const counters = fallback.counters.map((counter, index) => {
    const source = candidate.counters[index] || {};
    return {
      id: counter.id,
      value: Number.isFinite(source.value) && source.value >= 0 ? Math.floor(source.value) : 0,
    };
  });
  const activeExists = counters.some((counter) => counter.id === candidate.activeCounterId);
  const results = Array.isArray(candidate.results)
    ? candidate.results
        .filter((item) => item && Number.isFinite(item.value) && Number.isFinite(item.savedAt))
        .slice(0, HISTORY_LIMIT)
        .map((item, index) => ({
          id: typeof item.id === "string" ? item.id : `${item.savedAt}-${index}`,
          counterId: legacyCounterId(item),
          value: Math.max(0, Math.floor(item.value)),
          savedAt: item.savedAt,
        }))
    : [];

  return {
    schemaVersion: 1,
    activeCounterId: activeExists ? candidate.activeCounterId : counters[0].id,
    vibrationEnabled: candidate.vibrationEnabled !== false,
    screenBrightTime: SCREEN_BRIGHT_OPTIONS.includes(candidate.screenBrightTime)
      ? candidate.screenBrightTime
      : 0,
    counters,
    results,
  };
}

export function loadState() {
  try {
    const storage = new LocalStorage();
    const raw = storage.getItem(STORAGE_KEY, "");
    return raw ? normalizeState(JSON.parse(raw)) : createDefaultState();
  } catch (_error) {
    return createDefaultState();
  }
}

export function saveState(state) {
  const storage = new LocalStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
}
