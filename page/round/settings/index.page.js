import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { push } from "@zos/router";
import { Vibrator, VIBRATOR_SCENE_SHORT_LIGHT } from "@zos/sensor";
import { loadState, saveState } from "../../../utils/state";
import { TYPOGRAPHY } from "../../../utils/theme";
import { fitTextSize } from "../../../utils/text-layout";
import { applyStoredScreenBrightTime } from "../../../utils/screen-bright";

const COLORS = {
  background: 0x000000,
  textTitle: 0xffffff,
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
    applyStoredScreenBrightTime();
    const list = hmUI.createWidget(hmUI.widget.VIEW_CONTAINER, {
      x: 0,
      y: 0,
      w: 480,
      h: 480,
      scroll_enable: 1,
      bounce: 0,
    });
    const settingsLabel = text("settings");
    const vibrationLabel = text("vibration");
    const timeoutTitle = text("screenTimeout");
    const tutorialLabel = text("tutorial");
    const aboutLabel = text("about");
    this.addText(settingsLabel, 130, 24, 220, 62, fitTextSize(settingsLabel, 220, TYPOGRAPHY.title, 22), COLORS.textTitle, hmUI.align.CENTER_H, list);

    this.addText(vibrationLabel, 68, 100, 225, 60, fitTextSize(vibrationLabel, 225, TYPOGRAPHY.subheadline, 20), COLORS.textTitle, hmUI.align.LEFT, list);
    list.createWidget(hmUI.widget.SLIDE_SWITCH, {
      x: 320,
      y: 106,
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
    const timeoutLabel = {
      0: text("timeoutSystemShort"),
      15000: text("timeout15Short"),
      30000: text("timeout30Short"),
      60000: text("timeout1mShort"),
    }[pageState.screenBrightTime] || text("timeoutSystemShort");
    this.addText(timeoutTitle, 68, 184, 226, 68, fitTextSize(timeoutTitle, 226, TYPOGRAPHY.subheadline, 18), COLORS.textTitle, hmUI.align.LEFT, list);
    this.addText(timeoutLabel, 282, 184, 82, 68, fitTextSize(timeoutLabel, 82, TYPOGRAPHY.caption, 15, 6), COLORS.textSecondaryInfo, hmUI.align.RIGHT, list);
    this.addText("›", 366, 182, 42, 68, TYPOGRAPHY.title1, COLORS.textSecondaryInfo, hmUI.align.CENTER_H, list);
    list.createWidget(hmUI.widget.BUTTON, {
      text: "",
      x: 54,
      y: 184,
      w: 372,
      h: 68,
      normal_src: "image/settings_row_normal.png",
      press_src: "image/settings_row_pressed.png",
      click_func: () => push({ url: "page/round/screen-timeout/index.page" }),
    });

    this.addText(tutorialLabel, 68, 260, 296, 68, fitTextSize(tutorialLabel, 296, TYPOGRAPHY.subheadline, 20), COLORS.textTitle, hmUI.align.LEFT, list);
    this.addText("›", 366, 258, 42, 68, TYPOGRAPHY.title1, COLORS.textSecondaryInfo, hmUI.align.CENTER_H, list);
    list.createWidget(hmUI.widget.BUTTON, {
      text: "",
      x: 54,
      y: 260,
      w: 372,
      h: 68,
      normal_src: "image/settings_row_normal.png",
      press_src: "image/settings_row_pressed.png",
      click_func: () => push({ url: "page/round/tutorial/index.page" }),
    });

    this.addText(aboutLabel, 68, 336, 296, 68, fitTextSize(aboutLabel, 296, TYPOGRAPHY.subheadline, 20), COLORS.textTitle, hmUI.align.LEFT, list);
    this.addText("›", 366, 334, 42, 68, TYPOGRAPHY.title1, COLORS.textSecondaryInfo, hmUI.align.CENTER_H, list);
    list.createWidget(hmUI.widget.BUTTON, {
      text: "",
      x: 54,
      y: 336,
      w: 372,
      h: 68,
      normal_src: "image/settings_row_normal.png",
      press_src: "image/settings_row_pressed.png",
      click_func: () => push({ url: "page/round/about/index.page" }),
    });

    list.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 412,
      w: 480,
      h: 180,
      color: COLORS.background,
    });
    hmUI.createWidget(hmUI.widget.PAGE_SCROLLBAR, { target: list });
  },

  onResume() {
    applyStoredScreenBrightTime();
  },

  onDestroy() {
    if (vibrationStopTimer) clearTimeout(vibrationStopTimer);
    try {
      if (vibrator) vibrator.stop();
    } catch (_error) {}
  },

  addText(value, x, y, w, h, size, color = COLORS.textTitle, align = hmUI.align.CENTER_H, parent = null) {
    const options = {
      text: value, x, y, w, h, color, text_size: size,
      align_h: align, align_v: hmUI.align.CENTER_V, text_style: hmUI.text_style.NONE,
    };
    return parent
      ? parent.createWidget(hmUI.widget.TEXT, options)
      : hmUI.createWidget(hmUI.widget.TEXT, options);
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
