import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { COUNTER_IDS, loadState, saveState } from "../../../utils/state";
import { TYPOGRAPHY } from "../../../utils/theme";
import { fitTextSize } from "../../../utils/text-layout";
import { applyStoredScreenBrightTime } from "../../../utils/screen-bright";
import { createInteractiveRow } from "../../../utils/interactive-row";

const COLORS = {
  background: 0x000000,
  textTitle: 0xffffff,
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
    hmUI.updateStatusBarTitle(text("quickCardCounter"));
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

    COUNTER_IDS.forEach((counterId, index) => {
      const label = text(`counter${index + 1}`);
      const active = pageState.quickCardCounterId === counterId;
      const row = createInteractiveRow(list, {
        x: 16,
        y: 10 + index * 68,
        w: 358,
        h: 60,
      }, () => this.select(counterId));
      radioWidgets.push({
        counterId,
        widget: row.createWidget(hmUI.widget.IMG, {
          x: 298,
          y: 4,
          src: active ? "image/radio_on.png" : "image/radio_off.png",
        }),
      });
      row.createWidget(hmUI.widget.TEXT, {
        text: label,
        x: 16,
        y: 0,
        w: 266,
        h: 60,
        color: COLORS.textTitle,
        text_size: fitTextSize(label, 266, TYPOGRAPHY.subheadline, 18),
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text_style: hmUI.text_style.NONE,
      });
    });

    list.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 350,
      w: 390,
      h: 80,
      color: COLORS.background,
    });
    hmUI.createWidget(hmUI.widget.PAGE_SCROLLBAR, { target: list });
  },

  onResume() {
    hmUI.updateStatusBarTitle(text("quickCardCounter"));
    applyStoredScreenBrightTime();
  },

  select(counterId) {
    if (!COUNTER_IDS.includes(counterId) || pageState.quickCardCounterId === counterId) return;
    pageState.quickCardCounterId = counterId;
    radioWidgets.forEach((item) => {
      item.widget.setProperty(hmUI.prop.MORE, {
        src: item.counterId === counterId ? "image/radio_on.png" : "image/radio_off.png",
      });
    });
    saveState(pageState);
  },
});
