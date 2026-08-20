import {
  DATE_ORDER_DMY,
  DATE_ORDER_MDY,
  DATE_ORDER_YMD,
  TIME_ORDER_12,
  TIME_ORDER_24,
  formatLocalDate,
  formatLocalTime,
} from "./workout-extension-snapshot.js";

export function dateOrderFromSystem(format, dateFormatDmy, dateFormatMdy) {
  if (format === dateFormatDmy) return DATE_ORDER_DMY;
  if (format === dateFormatMdy) return DATE_ORDER_MDY;
  return DATE_ORDER_YMD;
}

export function timeOrderFromSystem(format, timeFormat12) {
  return format === timeFormat12 ? TIME_ORDER_12 : TIME_ORDER_24;
}

export function resetTimeLines(timestamp, dateOrder, timeOrder) {
  return {
    date: formatLocalDate(timestamp, dateOrder),
    time: formatLocalTime(timestamp, timeOrder),
  };
}

export function historyCountTextSize(value, isSquare = false) {
  const digits = `${value}`.length;
  if (isSquare) {
    if (digits <= 4) return 36;
    if (digits <= 6) return 30;
    if (digits <= 9) return 24;
    return 20;
  }
  if (digits <= 4) return 42;
  if (digits <= 6) return 34;
  if (digits <= 9) return 28;
  return 22;
}
