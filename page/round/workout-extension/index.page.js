import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { DATE_FORMAT_DMY, DATE_FORMAT_MDY, getDateFormat } from "@zos/settings";
import { TYPOGRAPHY } from "../../../utils/theme";
import { fitTextSize } from "../../../utils/text-layout";
import { applyStoredScreenBrightTime } from "../../../utils/screen-bright";
import {
  DATE_ORDER_DMY,
  DATE_ORDER_MDY,
  DATE_ORDER_YMD,
  formatLocalDateTime,
} from "../../../utils/workout-extension-snapshot";
import { readWorkoutExtensionSnapshot } from "../../../utils/workout-extension-storage";

const COLORS = {
  background: 0x000000,
  textTitle: 0xffffff,
  textSecondaryInfo: 0xaeb2ba,
  divider: 0x2a2c30,
};

let widgets = [];
let isBuilt = false;

function text(key) {
  return getText(key) || key;
}

function countTextSize(value) {
  const digits = `${value}`.length;
  if (digits <= 6) return TYPOGRAPHY.largeTitle;
  if (digits <= 9) return TYPOGRAPHY.title1;
  return TYPOGRAPHY.body;
}

function readSystemDateOrder() {
  try {
    const format = getDateFormat();
    if (format === DATE_FORMAT_DMY) return DATE_ORDER_DMY;
    if (format === DATE_FORMAT_MDY) return DATE_ORDER_MDY;
  } catch (_error) {}
  return DATE_ORDER_YMD;
}

function timeLabel(key, timestamp, dateOrder) {
  const formatted = formatLocalDateTime(timestamp, dateOrder);
  return formatted ? text(key).replace("{time}", formatted) : "";
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

  addText(value, x, y, w, h, size, color = COLORS.textTitle, style = hmUI.text_style.NONE) {
    return this.addWidget(hmUI.widget.TEXT, {
      text: value,
      x,
      y,
      w,
      h,
      color,
      text_size: size,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: style,
    });
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

    const title = text("workoutExtension");
    this.addText(title, 70, 24, 340, 58, fitTextSize(title, 340, TYPOGRAPHY.title, 22));

    const snapshot = readWorkoutExtensionSnapshot();
    if (!snapshot) {
      const unavailable = text("workoutExtensionUnavailable");
      this.addText(
        unavailable,
        72,
        142,
        336,
        156,
        TYPOGRAPHY.caption,
        COLORS.textSecondaryInfo,
        hmUI.text_style.WRAP,
      );
      return;
    }

    const dateOrder = readSystemDateOrder();
    const currentLabel = text("workoutExtensionCurrentResult");
    this.addText(currentLabel, 76, 100, 328, 40, fitTextSize(currentLabel, 328, TYPOGRAPHY.caption, 18), COLORS.textSecondaryInfo);
    this.addText(`${snapshot.currentResult.count}`, 76, 140, 328, 72, countTextSize(snapshot.currentResult.count));
    const updatedLabel = timeLabel("workoutExtensionUpdatedAt", snapshot.currentResult.updatedAt, dateOrder);
    if (updatedLabel) {
      this.addText(updatedLabel, 72, 216, 336, 42, fitTextSize(updatedLabel, 336, 20, 16, 0), COLORS.textSecondaryInfo);
    }

    if (!snapshot.lastResult) return;
    this.addWidget(hmUI.widget.FILL_RECT, {
      x: 150,
      y: 282,
      w: 180,
      h: 2,
      color: COLORS.divider,
    });
    const lastLabel = text("workoutExtensionLastResult");
    this.addText(lastLabel, 76, 300, 328, 38, fitTextSize(lastLabel, 328, TYPOGRAPHY.caption, 18), COLORS.textSecondaryInfo);
    this.addText(`${snapshot.lastResult.count}`, 76, 338, 328, 66, countTextSize(snapshot.lastResult.count));
    const resetLabel = timeLabel("workoutExtensionResetAt", snapshot.lastResult.resetAt, dateOrder);
    if (resetLabel) {
      this.addText(resetLabel, 72, 408, 336, 40, fitTextSize(resetLabel, 336, 20, 16, 0), COLORS.textSecondaryInfo);
    }
  },
});
