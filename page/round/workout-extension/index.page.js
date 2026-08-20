import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import {
  DATE_FORMAT_DMY,
  DATE_FORMAT_MDY,
  TIME_FORMAT_12,
  getDateFormat,
  getTimeFormat,
} from "@zos/settings";
import { TYPOGRAPHY } from "../../../utils/theme";
import { fitTextSize } from "../../../utils/text-layout";
import { applyStoredScreenBrightTime } from "../../../utils/screen-bright";
import { formatLocalDateTime } from "../../../utils/workout-extension-snapshot";
import {
  dateOrderFromSystem,
  historyCountTextSize,
  resetTimeLines,
  timeOrderFromSystem,
} from "../../../utils/workout-extension-view";
import { readWorkoutExtensionSnapshot } from "../../../utils/workout-extension-storage";

const COLORS = {
  background: 0x000000,
  textTitle: 0xffffff,
  textSecondaryInfo: 0xaeb2ba,
  divider: 0x2a2c30,
};

const HISTORY_START_Y = 304;
const HISTORY_ROW_HEIGHT = 82;
const FOOTER_HEIGHT = 132;

let widgets = [];
let isBuilt = false;

function text(key) {
  return getText(key) || key;
}

function currentCountTextSize(value) {
  const digits = `${value}`.length;
  if (digits <= 4) return TYPOGRAPHY.largeTitle;
  if (digits <= 7) return TYPOGRAPHY.title1;
  if (digits <= 10) return TYPOGRAPHY.subheadline;
  return TYPOGRAPHY.caption;
}

function readSystemFormats() {
  let dateFormat;
  let timeFormat;
  try {
    dateFormat = getDateFormat();
  } catch (_error) {}
  try {
    timeFormat = getTimeFormat();
  } catch (_error) {}
  return {
    dateOrder: dateOrderFromSystem(dateFormat, DATE_FORMAT_DMY, DATE_FORMAT_MDY),
    timeOrder: timeOrderFromSystem(timeFormat, TIME_FORMAT_12),
  };
}

function createText(parent, value, options) {
  return parent.createWidget(hmUI.widget.TEXT, {
    text: value,
    color: COLORS.textTitle,
    align_h: hmUI.align.CENTER_H,
    align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.NONE,
    ...options,
  });
}

Page({
  onInit() {
    widgets = [];
    isBuilt = false;
  },

  build() {
    isBuilt = true;
    applyStoredScreenBrightTime();
    this.renderSnapshot();
  },

  onResume() {
    applyStoredScreenBrightTime();
    if (isBuilt) this.renderSnapshot();
  },

  onDestroy() {
    this.clearWidgets();
    isBuilt = false;
  },

  addWidget(type, options) {
    const created = hmUI.createWidget(type, options);
    widgets.push(created);
    return created;
  },

  clearWidgets() {
    widgets.slice().reverse().forEach((item) => {
      try {
        hmUI.deleteWidget(item);
      } catch (_error) {}
    });
    widgets = [];
  },

  renderSnapshot() {
    this.clearWidgets();
    this.addWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 0,
      w: 480,
      h: 480,
      color: COLORS.background,
    });
    const list = this.addWidget(hmUI.widget.VIEW_CONTAINER, {
      x: 0,
      y: 0,
      w: 480,
      h: 480,
      scroll_enable: 1,
      bounce: 0,
    });

    const title = text("workoutExtension");
    createText(list, title, {
      x: 70,
      y: 14,
      w: 340,
      h: 56,
      text_size: fitTextSize(title, 340, TYPOGRAPHY.title, 22),
    });

    const snapshot = readWorkoutExtensionSnapshot();
    if (!snapshot) {
      createText(list, text("workoutExtensionUnavailable"), {
        x: 72,
        y: 128,
        w: 336,
        h: 152,
        color: COLORS.textSecondaryInfo,
        text_size: TYPOGRAPHY.caption,
        text_style: hmUI.text_style.WRAP,
      });
      list.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 320,
        w: 480,
        h: 160,
        color: COLORS.background,
      });
      this.addWidget(hmUI.widget.PAGE_SCROLLBAR, { target: list });
      return;
    }

    const { dateOrder, timeOrder } = readSystemFormats();
    const currentLabel = text("workoutExtensionCurrentResult");
    createText(list, currentLabel, {
      x: 76,
      y: 82,
      w: 328,
      h: 36,
      color: COLORS.textSecondaryInfo,
      text_size: fitTextSize(currentLabel, 328, TYPOGRAPHY.caption, 18),
    });
    createText(list, `${snapshot.currentResult.count}`, {
      x: 68,
      y: 120,
      w: 134,
      h: 68,
      text_size: currentCountTextSize(snapshot.currentResult.count),
    });
    const updatedAt = formatLocalDateTime(snapshot.currentResult.updatedAt, dateOrder, timeOrder);
    if (updatedAt) {
      const updatedLabel = text("workoutExtensionUpdatedAt").replace("{time}", updatedAt);
      createText(list, updatedLabel, {
        x: 214,
        y: 120,
        w: 198,
        h: 68,
        color: COLORS.textSecondaryInfo,
        text_size: fitTextSize(updatedLabel, 198, 20, 15, 4),
        text_style: hmUI.text_style.WRAP,
      });
    }

    list.createWidget(hmUI.widget.FILL_RECT, {
      x: 150,
      y: 224,
      w: 180,
      h: 2,
      color: COLORS.divider,
    });
    const historyLabel = text("workoutExtensionCountHistory");
    createText(list, historyLabel, {
      x: 76,
      y: 246,
      w: 328,
      h: 40,
      color: COLORS.textSecondaryInfo,
      text_size: fitTextSize(historyLabel, 328, TYPOGRAPHY.caption, 18),
    });

    if (snapshot.resetHistory.length === 0) {
      createText(list, text("workoutExtensionNoHistory"), {
        x: 72,
        y: HISTORY_START_Y + 6,
        w: 336,
        h: 70,
        color: COLORS.textSecondaryInfo,
        text_size: TYPOGRAPHY.caption,
        text_style: hmUI.text_style.WRAP,
      });
      list.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: HISTORY_START_Y + HISTORY_ROW_HEIGHT,
        w: 480,
        h: FOOTER_HEIGHT,
        color: COLORS.background,
      });
    } else {
      snapshot.resetHistory.forEach((item, index) => {
        const y = HISTORY_START_Y + index * HISTORY_ROW_HEIGHT;
        createText(list, `${item.count}`, {
          x: 68,
          y,
          w: 134,
          h: 64,
          text_size: historyCountTextSize(item.count),
        });
        const resetTime = resetTimeLines(item.resetAt, dateOrder, timeOrder);
        if (resetTime.date) {
          createText(list, resetTime.date, {
            x: 220,
            y: y + 4,
            w: 190,
            h: 28,
            color: COLORS.textSecondaryInfo,
            text_size: 21,
          });
          createText(list, resetTime.time, {
            x: 220,
            y: y + 32,
            w: 190,
            h: 28,
            color: COLORS.textSecondaryInfo,
            text_size: 21,
          });
        }
      });
      list.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: HISTORY_START_Y + snapshot.resetHistory.length * HISTORY_ROW_HEIGHT,
        w: 480,
        h: FOOTER_HEIGHT,
        color: COLORS.background,
      });
    }

    this.addWidget(hmUI.widget.PAGE_SCROLLBAR, { target: list });
  },
});
