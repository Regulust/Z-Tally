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
    const settingsLabel = text("settings");
    const vibrationLabel = text("vibration");
    const timeoutTitle = text("screenTimeout");
    const tutorialLabel = text("tutorial");
    const aboutLabel = text("about");
    hmUI.updateStatusBarTitle(settingsLabel);
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 64,
      w: 390,
      h: 386,
      color: COLORS.background,
    });
    const list = hmUI.createWidget(hmUI.widget.VIEW_CONTAINER, {
      x: 0,
      y: 64,
      w: 390,
      h: 386,
      scroll_enable: 1,
      bounce: 0,
    });
    this.addText(vibrationLabel, 20, 22, 220, 58, fitTextSize(vibrationLabel, 220, TYPOGRAPHY.subheadline, 20), COLORS.textTitle, hmUI.align.LEFT, list);
    list.createWidget(hmUI.widget.SLIDE_SWITCH, {
      x: 284,
      y: 27,
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
    this.addText(timeoutTitle, 20, 92, 205, 60, fitTextSize(timeoutTitle, 205, TYPOGRAPHY.subheadline, 18), COLORS.textTitle, hmUI.align.LEFT, list);
    this.addText(timeoutLabel, 224, 92, 102, 60, fitTextSize(timeoutLabel, 102, TYPOGRAPHY.caption, 16, 6), COLORS.textSecondaryInfo, hmUI.align.RIGHT, list);
    this.addText("›", 334, 90, 36, 60, TYPOGRAPHY.title1, COLORS.textSecondaryInfo, hmUI.align.CENTER_H, list);
    list.createWidget(hmUI.widget.BUTTON, {
      text: "",
      x: 17,
      y: 92,
      w: 356,
      h: 60,
      normal_src: "image/settings_row_normal.png",
      press_src: "image/settings_row_pressed.png",
      click_func: () => push({ url: "page/square/screen-timeout/index.page" }),
    });

    this.addText(tutorialLabel, 20, 162, 300, 60, fitTextSize(tutorialLabel, 300, TYPOGRAPHY.subheadline, 20), COLORS.textTitle, hmUI.align.LEFT, list);
    this.addText("›", 334, 160, 36, 60, TYPOGRAPHY.title1, COLORS.textSecondaryInfo, hmUI.align.CENTER_H, list);
    list.createWidget(hmUI.widget.BUTTON, {
      text: "",
      x: 17,
      y: 162,
      w: 356,
      h: 60,
      normal_src: "image/settings_row_normal.png",
      press_src: "image/settings_row_pressed.png",
      click_func: () => push({ url: "page/square/tutorial/index.page" }),
    });

    this.addText(aboutLabel, 20, 232, 300, 60, fitTextSize(aboutLabel, 300, TYPOGRAPHY.subheadline, 20), COLORS.textTitle, hmUI.align.LEFT, list);
    this.addText("›", 334, 230, 36, 60, TYPOGRAPHY.title1, COLORS.textSecondaryInfo, hmUI.align.CENTER_H, list);
    list.createWidget(hmUI.widget.BUTTON, {
      text: "",
      x: 17,
      y: 232,
      w: 356,
      h: 60,
      normal_src: "image/settings_row_normal.png",
      press_src: "image/settings_row_pressed.png",
      click_func: () => push({ url: "page/square/about/index.page" }),
    });

    list.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 302,
      w: 390,
      h: 150,
      color: COLORS.background,
    });
    hmUI.createWidget(hmUI.widget.PAGE_SCROLLBAR, { target: list });
  },

  onResume() {
    hmUI.updateStatusBarTitle(text("settings"));
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
