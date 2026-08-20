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

const HISTORY_START_Y = 224;
const HISTORY_ROW_HEIGHT = 76;
const FOOTER_HEIGHT = 104;

let widgets = [];
let isBuilt = false;

function text(key) {
  return getText(key) || key;
}

function currentCountTextSize(value) {
  const digits = `${value}`.length;
  if (digits <= 4) return 42;
  if (digits <= 7) return 34;
  if (digits <= 10) return 27;
  return 22;
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
    hmUI.updateStatusBarTitle(text("workoutExtension"));
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
    hmUI.updateStatusBarTitle(text("workoutExtension"));
    this.addWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 64,
      w: 390,
      h: 386,
      color: COLORS.background,
    });
    const list = this.addWidget(hmUI.widget.VIEW_CONTAINER, {
      x: 0,
      y: 64,
      w: 390,
      h: 386,
      scroll_enable: 1,
      bounce: 0,
    });

    const snapshot = readWorkoutExtensionSnapshot();
    if (!snapshot) {
      createText(list, text("workoutExtensionUnavailable"), {
        x: 40,
        y: 82,
        w: 310,
        h: 144,
        color: COLORS.textSecondaryInfo,
        text_size: TYPOGRAPHY.caption,
        text_style: hmUI.text_style.WRAP,
      });
      list.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 270,
        w: 390,
        h: 116,
        color: COLORS.background,
      });
      this.addWidget(hmUI.widget.PAGE_SCROLLBAR, { target: list });
      return;
    }

    const { dateOrder, timeOrder } = readSystemFormats();
    const currentLabel = text("workoutExtensionCurrentResult");
    createText(list, currentLabel, {
      x: 36,
      y: 12,
      w: 318,
      h: 36,
      color: COLORS.textSecondaryInfo,
      text_size: fitTextSize(currentLabel, 318, TYPOGRAPHY.caption, 18),
    });
    createText(list, `${snapshot.currentResult.count}`, {
      x: 24,
      y: 50,
      w: 126,
      h: 64,
      text_size: currentCountTextSize(snapshot.currentResult.count),
    });
    const updatedAt = formatLocalDateTime(snapshot.currentResult.updatedAt, dateOrder, timeOrder);
    if (updatedAt) {
      const updatedLabel = text("workoutExtensionUpdatedAt").replace("{time}", updatedAt);
      createText(list, updatedLabel, {
        x: 164,
        y: 50,
        w: 202,
        h: 64,
        color: COLORS.textSecondaryInfo,
        text_size: fitTextSize(updatedLabel, 202, 18, 14, 4),
        text_style: hmUI.text_style.WRAP,
      });
    }

    list.createWidget(hmUI.widget.FILL_RECT, {
      x: 105,
      y: 144,
      w: 180,
      h: 2,
      color: COLORS.divider,
    });
    const historyLabel = text("workoutExtensionCountHistory");
    createText(list, historyLabel, {
      x: 36,
      y: 164,
      w: 318,
      h: 38,
      color: COLORS.textSecondaryInfo,
      text_size: fitTextSize(historyLabel, 318, TYPOGRAPHY.caption, 18),
    });

    if (snapshot.resetHistory.length === 0) {
      createText(list, text("workoutExtensionNoHistory"), {
        x: 40,
        y: HISTORY_START_Y,
        w: 310,
        h: 68,
        color: COLORS.textSecondaryInfo,
        text_size: TYPOGRAPHY.caption,
        text_style: hmUI.text_style.WRAP,
      });
      list.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: HISTORY_START_Y + HISTORY_ROW_HEIGHT,
        w: 390,
        h: FOOTER_HEIGHT,
        color: COLORS.background,
      });
    } else {
      snapshot.resetHistory.forEach((item, index) => {
        const y = HISTORY_START_Y + index * HISTORY_ROW_HEIGHT;
        createText(list, `${item.count}`, {
          x: 24,
          y,
          w: 126,
          h: 60,
          text_size: historyCountTextSize(item.count, true),
        });
        const resetTime = resetTimeLines(item.resetAt, dateOrder, timeOrder);
        if (resetTime.date) {
          createText(list, resetTime.date, {
            x: 170,
            y: y + 3,
            w: 196,
            h: 27,
            color: COLORS.textSecondaryInfo,
            text_size: 19,
          });
          createText(list, resetTime.time, {
            x: 170,
            y: y + 30,
            w: 196,
            h: 27,
            color: COLORS.textSecondaryInfo,
            text_size: 19,
          });
        }
      });
      list.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: HISTORY_START_Y + snapshot.resetHistory.length * HISTORY_ROW_HEIGHT,
        w: 390,
        h: FOOTER_HEIGHT,
        color: COLORS.background,
      });
    }

    this.addWidget(hmUI.widget.PAGE_SCROLLBAR, { target: list });
  },
});
