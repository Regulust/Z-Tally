import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { back } from "@zos/router";
import { setPageBrightTime, resetPageBrightTime } from "@zos/display";
import { Vibrator, VIBRATOR_SCENE_SHORT_LIGHT } from "@zos/sensor";
import { SCREEN_BRIGHT_OPTIONS, loadState, saveState } from "../../../utils/state";

const COLORS = {
  background: 0x000000,
  textTitle: 0xffffff,
  textSecondaryInfo: 0x808080,
};

let pageState = null;
let vibrator = null;

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
    this.addText(text("screenTimeout"), 74, 20, 332, 64, 34);
    this.addText(text("screenOnlyAffects"), 62, 78, 356, 38, 20, COLORS.textSecondaryInfo);

    const list = hmUI.createWidget(hmUI.widget.VIEW_CONTAINER, {
      x: 0,
      y: 116,
      w: 480,
      h: 316,
      scroll_enable: 1,
      bounce: 0,
    });

    [
      { label: text("timeoutSystemDefault"), value: 0 },
      { label: text("timeout15"), value: 15000 },
      { label: text("timeout30"), value: 30000 },
      { label: text("timeout1m"), value: 60000 },
    ].forEach((option, index) => {
      const active = pageState.screenBrightTime === option.value;
      const y = 4 + index * 90;
      list.createWidget(hmUI.widget.IMG, {
        x: 46,
        y: y + 9,
        src: active ? "image/radio_on.png" : "image/radio_off.png",
      });
      list.createWidget(hmUI.widget.TEXT, {
        text: option.label,
        x: 120,
        y,
        w: 292,
        h: 68,
        color: COLORS.textTitle,
        text_size: 27,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text_style: hmUI.text_style.NONE,
      });
      list.createWidget(hmUI.widget.BUTTON, {
        text: "",
        x: 34,
        y,
        w: 410,
        h: 68,
        normal_src: "image/option_row_normal.png",
        press_src: "image/option_row_pressed.png",
        click_func: () => this.select(option.value),
      });
    });
    list.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 366,
      w: 480,
      h: 100,
      color: COLORS.background,
    });
    hmUI.createWidget(hmUI.widget.PAGE_SCROLLBAR, { target: list });
  },

  addText(value, x, y, w, h, size, color = COLORS.textTitle) {
    return hmUI.createWidget(hmUI.widget.TEXT, {
      text: value, x, y, w, h, color, text_size: size,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE,
    });
  },

  select(duration) {
    if (!SCREEN_BRIGHT_OPTIONS.includes(duration)) return;
    pageState.screenBrightTime = duration;
    saveState(pageState);
    try {
      if (duration > 0) setPageBrightTime({ brightTime: duration });
      else resetPageBrightTime();
    } catch (_error) {}
    if (pageState.vibrationEnabled && vibrator) {
      try {
        vibrator.stop();
        vibrator.start({ mode: VIBRATOR_SCENE_SHORT_LIGHT });
        setTimeout(() => {
          try {
            vibrator.stop();
          } catch (_error) {}
        }, 30);
      } catch (_error) {}
    }
    back();
  },
});
