import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { TYPOGRAPHY } from "../../../utils/theme";
import { fitTextSize } from "../../../utils/text-layout";
import { applyStoredScreenBrightTime } from "../../../utils/screen-bright";
import { formatLocalDateTime } from "../../../utils/workout-extension-snapshot";
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
  if (digits <= 5) return TYPOGRAPHY.largeTitle;
  if (digits <= 8) return TYPOGRAPHY.title1;
  return TYPOGRAPHY.body;
}

function timeLabel(key, timestamp) {
  const formatted = formatLocalDateTime(timestamp);
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
    hmUI.updateStatusBarTitle(text("workoutExtension"));
    this.addWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 64,
      w: 390,
      h: 386,
      color: COLORS.background,
    });

    const snapshot = readWorkoutExtensionSnapshot();
    if (!snapshot) {
      const unavailable = text("workoutExtensionUnavailable");
      this.addText(
        unavailable,
        42,
        154,
        306,
        144,
        fitTextSize(unavailable, 306, 20, 16, 0),
        COLORS.textSecondaryInfo,
        hmUI.text_style.WRAP,
      );
      return;
    }

    const currentLabel = text("workoutExtensionCurrentResult");
    this.addText(currentLabel, 40, 92, 310, 38, fitTextSize(currentLabel, 310, TYPOGRAPHY.caption, 18), COLORS.textSecondaryInfo);
    this.addText(`${snapshot.currentResult.count}`, 40, 130, 310, 66, countTextSize(snapshot.currentResult.count));
    const updatedLabel = timeLabel("workoutExtensionUpdatedAt", snapshot.currentResult.updatedAt);
    if (updatedLabel) {
      this.addText(updatedLabel, 36, 198, 318, 38, fitTextSize(updatedLabel, 318, 19, 15, 0), COLORS.textSecondaryInfo);
    }

    if (!snapshot.lastResult) return;
    this.addWidget(hmUI.widget.FILL_RECT, {
      x: 105,
      y: 258,
      w: 180,
      h: 2,
      color: COLORS.divider,
    });
    const lastLabel = text("workoutExtensionLastResult");
    this.addText(lastLabel, 40, 270, 310, 36, fitTextSize(lastLabel, 310, TYPOGRAPHY.caption, 18), COLORS.textSecondaryInfo);
    this.addText(`${snapshot.lastResult.count}`, 40, 306, 310, 62, countTextSize(snapshot.lastResult.count));
    const resetLabel = timeLabel("workoutExtensionResetAt", snapshot.lastResult.resetAt);
    if (resetLabel) {
      this.addText(resetLabel, 36, 372, 318, 38, fitTextSize(resetLabel, 318, 19, 15, 0), COLORS.textSecondaryInfo);
    }
  },
});
