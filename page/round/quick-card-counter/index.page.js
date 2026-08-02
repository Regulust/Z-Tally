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
    const title = text("quickCardCounter");
    const list = hmUI.createWidget(hmUI.widget.VIEW_CONTAINER, {
      x: 0,
      y: 0,
      w: 480,
      h: 480,
      scroll_enable: 1,
      bounce: 0,
    });

    list.createWidget(hmUI.widget.TEXT, {
      text: title,
      x: 74,
      y: 20,
      w: 332,
      h: 64,
      color: COLORS.textTitle,
      text_size: fitTextSize(title, 332, TYPOGRAPHY.title, 22),
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE,
    });

    COUNTER_IDS.forEach((counterId, index) => {
      const label = text(`counter${index + 1}`);
      const active = pageState.quickCardCounterId === counterId;
      const row = createInteractiveRow(list, {
        x: 34,
        y: 92 + index * 72,
        w: 410,
        h: 64,
      }, () => this.select(counterId));
      radioWidgets.push({
        counterId,
        widget: row.createWidget(hmUI.widget.IMG, {
          x: 346,
          y: 6,
          src: active ? "image/radio_on.png" : "image/radio_off.png",
        }),
      });
      row.createWidget(hmUI.widget.TEXT, {
        text: label,
        x: 24,
        y: 0,
        w: 300,
        h: 64,
        color: COLORS.textTitle,
        text_size: fitTextSize(label, 300, TYPOGRAPHY.subheadline, 18),
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text_style: hmUI.text_style.NONE,
      });
    });

    list.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 458,
      w: 480,
      h: 80,
      color: COLORS.background,
    });
    hmUI.createWidget(hmUI.widget.PAGE_SCROLLBAR, { target: list });
  },

  onResume() {
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
