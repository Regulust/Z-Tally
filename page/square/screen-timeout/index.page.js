import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { SCREEN_BRIGHT_OPTIONS, loadState, saveState } from "../../../utils/state";
import { TYPOGRAPHY } from "../../../utils/theme";
import { fitTextSize } from "../../../utils/text-layout";
import { applyScreenBrightTime, applyStoredScreenBrightTime } from "../../../utils/screen-bright";
import { createInteractiveRow } from "../../../utils/interactive-row";

const COLORS = {
  background: 0x000000,
  textTitle: 0xffffff,
  textSecondaryInfo: 0x808080,
};

let pageState = null;
let radioWidgets = [];

function text(key) {
  return getText(key) || key;
}

Page({
  onInit() {
    pageState = loadState();
    radioWidgets = [];
  },

  build() {
    applyStoredScreenBrightTime();
    const title = text("screenTimeout");
    const scopeNote = text("screenOnlyAffects");
    hmUI.updateStatusBarTitle(title);
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
    this.addText(scopeNote, 20, 14, 350, 32, fitTextSize(scopeNote, 350, TYPOGRAPHY.caption, 18), COLORS.textSecondaryInfo, list);

    [
      { label: text("timeoutSystemDefault"), value: 0 },
      { label: text("timeout15"), value: 15000 },
      { label: text("timeout30"), value: 30000 },
      { label: text("timeout1m"), value: 60000 },
    ].forEach((option, index) => {
      const active = pageState.screenBrightTime === option.value;
      const y = 54 + index * 72;
      const row = createInteractiveRow(list, {
        x: 16,
        y,
        w: 358,
        h: 60,
      }, () => this.select(option.value));
      radioWidgets.push({
        value: option.value,
        widget: row.createWidget(hmUI.widget.IMG, {
          x: 298,
          y: 4,
          src: active ? "image/radio_on.png" : "image/radio_off.png",
        }),
      });
      row.createWidget(hmUI.widget.TEXT, {
        text: option.label,
        x: 16,
        y: 0,
        w: 266,
        h: 60,
        color: COLORS.textTitle,
        text_size: fitTextSize(option.label, 266, TYPOGRAPHY.subheadline, 18),
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text_style: hmUI.text_style.NONE,
      });
    });
    list.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 348,
      w: 390,
      h: 120,
      color: COLORS.background,
    });
    hmUI.createWidget(hmUI.widget.PAGE_SCROLLBAR, { target: list });
  },

  onResume() {
    hmUI.updateStatusBarTitle(text("screenTimeout"));
    applyStoredScreenBrightTime();
  },

  addText(value, x, y, w, h, size, color = COLORS.textTitle, parent = null) {
    const options = {
      text: value, x, y, w, h, color, text_size: size,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE,
    };
    return parent
      ? parent.createWidget(hmUI.widget.TEXT, options)
      : hmUI.createWidget(hmUI.widget.TEXT, options);
  },

  select(duration) {
    if (!SCREEN_BRIGHT_OPTIONS.includes(duration)) return;
    if (pageState.screenBrightTime === duration) return;
    pageState.screenBrightTime = duration;
    radioWidgets.forEach((item) => {
      item.widget.setProperty(hmUI.prop.MORE, {
        src: item.value === duration ? "image/radio_on.png" : "image/radio_off.png",
      });
    });
    saveState(pageState);
    applyScreenBrightTime(duration);
  },
});
