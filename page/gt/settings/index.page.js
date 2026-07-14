import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { push } from "@zos/router";
import { Vibrator, VIBRATOR_SCENE_SHORT_LIGHT } from "@zos/sensor";
import { loadState, saveState } from "../../../utils/state";
import { TYPOGRAPHY } from "../../../utils/theme";

const COLORS = {
  sysButtonBg: 0x383838,
  sysButtonPressed: 0x282828,
  textTitle: 0xffffff,
  textButton: 0xffffff,
  textSecondaryInfo: 0x808080,
};

let pageState = null;
let vibrator = null;
let vibrationStopTimer = null;

function text(key) {
  return getText(key) || key;
}

Page({
  onInit() {
    pageState = loadState();
    try {
      vibrator = new Vibrator();
    } catch (_error) {
      vibrator = null;
    }
  },

  build() {
    this.addText(text("settings"), 130, 24, 220, 62, TYPOGRAPHY.title);
    this.addText(text("vibration"), 68, 122, 225, 60, TYPOGRAPHY.subheadline, COLORS.textTitle, hmUI.align.LEFT);
    hmUI.createWidget(hmUI.widget.SLIDE_SWITCH, {
      x: 320,
      y: 128,
      w: 84,
      h: 48,
      select_bg: "image/switch_on.png",
      un_select_bg: "image/switch_off.png",
      slide_src: "image/switch_thumb.png",
      slide_select_x: 43,
      slide_un_select_x: 7,
      checked: pageState.vibrationEnabled,
      checked_change_func: (_widget, checked) => this.setVibrationEnabled(checked),
    });
    this.addText(text("vibrationDescription"), 45, 184, 390, 58, TYPOGRAPHY.caption, COLORS.textSecondaryInfo);

    const timeoutLabel = {
      0: text("timeoutSystemShort"),
      15000: text("timeout15Short"),
      30000: text("timeout30Short"),
      60000: text("timeout1mShort"),
    }[pageState.screenBrightTime] || text("timeoutSystemShort");
    this.addText(text("screenTimeout"), 68, 240, 226, 72, TYPOGRAPHY.subheadline, COLORS.textTitle, hmUI.align.LEFT);
    this.addText(timeoutLabel, 282, 240, 82, 72, TYPOGRAPHY.caption, COLORS.textSecondaryInfo, hmUI.align.RIGHT);
    this.addText("›", 366, 238, 42, 72, TYPOGRAPHY.title1, COLORS.textSecondaryInfo);
    hmUI.createWidget(hmUI.widget.BUTTON, {
      text: "",
      x: 54,
      y: 240,
      w: 372,
      h: 72,
      normal_src: "image/settings_row_normal.png",
      press_src: "image/settings_row_pressed.png",
      click_func: () => push({ url: "page/gt/screen-timeout/index.page" }),
    });

    hmUI.createWidget(hmUI.widget.BUTTON, {
      text: `${text("about")}  ›`,
      x: 92,
      y: 338,
      w: 296,
      h: 66,
      color: COLORS.textButton,
      text_size: TYPOGRAPHY.subheadline,
      radius: 20,
      normal_color: COLORS.sysButtonBg,
      press_color: COLORS.sysButtonPressed,
      click_func: () => push({ url: "page/gt/about/index.page" }),
    });
  },

  onDestroy() {
    if (vibrationStopTimer) clearTimeout(vibrationStopTimer);
    try {
      if (vibrator) vibrator.stop();
    } catch (_error) {}
  },

  addText(value, x, y, w, h, size, color = COLORS.textTitle, align = hmUI.align.CENTER_H) {
    return hmUI.createWidget(hmUI.widget.TEXT, {
      text: value, x, y, w, h, color, text_size: size,
      align_h: align, align_v: hmUI.align.CENTER_V, text_style: hmUI.text_style.NONE,
    });
  },

  setVibrationEnabled(enabled) {
    pageState.vibrationEnabled = Boolean(enabled);
    saveState(pageState);
    if (!pageState.vibrationEnabled || !vibrator) return;
    try {
      vibrator.stop();
      vibrator.start({ mode: VIBRATOR_SCENE_SHORT_LIGHT });
      vibrationStopTimer = setTimeout(() => {
        vibrationStopTimer = null;
        try {
          vibrator.stop();
        } catch (_error) {}
      }, 30);
    } catch (_error) {}
  },
});
