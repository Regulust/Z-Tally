import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { TYPOGRAPHY } from "../../../utils/theme";

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
    hmUI.updateStatusBarTitle(text("about"));
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: 64, w: 390, h: 386, color: 0x000000 });
    addText(text("appName"), 20, 92, 350, 48, TYPOGRAPHY.title1);
    addText(text("aboutDescription"), 20, 144, 350, 40, TYPOGRAPHY.caption, COLORS.textSecondaryInfo);
    addText(text("aboutFeatures"), 20, 188, 350, 72, TYPOGRAPHY.caption);
    addText(text("version"), 20, 278, 350, 34, TYPOGRAPHY.caption, COLORS.textSecondaryInfo);
    addText(text("targetDevice"), 20, 318, 350, 34, TYPOGRAPHY.caption, COLORS.textSecondaryInfo);
    addText(text("developer"), 20, 358, 350, 34, TYPOGRAPHY.caption, COLORS.textSecondaryInfo);
  },

  onResume() {
    hmUI.updateStatusBarTitle(text("about"));
  },
});
