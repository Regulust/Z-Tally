# Changelog

## 1.2.1 - 2026-08-20

Version code 29.

- Added a read-only count-history list for up to 10 newest reset results published by Z-Tally Move 1.0.0.
- Kept compatibility with Move 0.2.0/0.2.1 by deriving one history row from `lastResult`; damaged history entries are ignored without hiding a valid current result.
- Added scrollable round and square layouts with system scrollbars, complete YMD/DMY/MDY dates, 12/24-hour time, long-number sizing, and localized empty states.
- Kept shared history read-only and isolated from Z-Tally's private counter history.

## 1.2.0 - 2026-08-20

Version code 28.

- Added a read-only Workout Extension page for viewing the current and most recent reset results from Z-Tally Move 0.2.0 or later.
- Kept both apps independent: unavailable, missing, damaged, or unsupported shared data falls back safely and is never copied into Z-Tally counters.
- Made shared-result dates follow the watch's YMD, DMY, or MDY setting; unknown reset times remain hidden.
