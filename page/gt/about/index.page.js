import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";

const COLORS = {
  textTitle: 0xffffff,
  textSecondaryInfo: 0x808080,
};

function text(key) {
  return getText(key) || key;
}

function addText(value, x, y, w, h, size, color = COLORS.textTitle) {
  return hmUI.createWidget(hmUI.widget.TEXT, {
    text: value, x, y, w, h, color, text_size: size,
    align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.NONE,
  });
}

Page({
  build() {
    addText(text("about"), 136, 24, 208, 62, 34);
    addText(text("appName"), 76, 108, 328, 58, 38);
    addText(text("aboutDescription"), 48, 168, 384, 46, 23, COLORS.textSecondaryInfo);
    addText(text("aboutFeatures"), 54, 216, 372, 78, 22);
    addText(text("version"), 76, 310, 328, 38, 21, COLORS.textSecondaryInfo);
    addText(text("targetDevice"), 76, 352, 328, 38, 21, COLORS.textSecondaryInfo);
    addText(text("developer"), 76, 394, 328, 38, 21, COLORS.textSecondaryInfo);
  },
});
