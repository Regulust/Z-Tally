import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { push } from "@zos/router";
import { Vibrator, VIBRATOR_SCENE_SHORT_LIGHT } from "@zos/sensor";
import { loadState, saveState } from "../../../utils/state";
import { TYPOGRAPHY } from "../../../utils/theme";
import { fitTextSize } from "../../../utils/text-layout";
import { applyStoredScreenBrightTime, withScreenBrightRefresh } from "../../../utils/screen-bright";
import { createInteractiveRow } from "../../../utils/interactive-row";

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
      checked_change_func: withScreenBrightRefresh((_widget, checked) => this.setVibrationEnabled(checked)),
    });
    const timeoutLabel = {
      0: text("timeoutSystemShort"),
      15000: text("timeout15Short"),
      30000: text("timeout30Short"),
      60000: text("timeout1mShort"),
    }[pageState.screenBrightTime] || text("timeoutSystemShort");
    const timeoutRow = createInteractiveRow(list, {
      x: 17,
      y: 90,
      w: 356,
      h: 62,
    }, () => push({ url: "page/square/screen-timeout/index.page" }));
    this.addText(timeoutTitle, 3, 2, 205, 60, fitTextSize(timeoutTitle, 205, TYPOGRAPHY.subheadline, 18), COLORS.textTitle, hmUI.align.LEFT, timeoutRow);
    this.addText(timeoutLabel, 207, 2, 102, 60, fitTextSize(timeoutLabel, 102, TYPOGRAPHY.caption, 16, 6), COLORS.textSecondaryInfo, hmUI.align.RIGHT, timeoutRow);
    this.addText("›", 317, 0, 36, 60, TYPOGRAPHY.title1, COLORS.textSecondaryInfo, hmUI.align.CENTER_H, timeoutRow);

    const tutorialRow = createInteractiveRow(list, {
      x: 17,
      y: 160,
      w: 356,
      h: 62,
    }, () => push({ url: "page/square/tutorial/index.page" }));
    this.addText(tutorialLabel, 3, 2, 300, 60, fitTextSize(tutorialLabel, 300, TYPOGRAPHY.subheadline, 20), COLORS.textTitle, hmUI.align.LEFT, tutorialRow);
    this.addText("›", 317, 0, 36, 60, TYPOGRAPHY.title1, COLORS.textSecondaryInfo, hmUI.align.CENTER_H, tutorialRow);

    const aboutRow = createInteractiveRow(list, {
      x: 17,
      y: 230,
      w: 356,
      h: 62,
    }, () => push({ url: "page/square/about/index.page" }));
    this.addText(aboutLabel, 3, 2, 300, 60, fitTextSize(aboutLabel, 300, TYPOGRAPHY.subheadline, 20), COLORS.textTitle, hmUI.align.LEFT, aboutRow);
    this.addText("›", 317, 0, 36, 60, TYPOGRAPHY.title1, COLORS.textSecondaryInfo, hmUI.align.CENTER_H, aboutRow);

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
