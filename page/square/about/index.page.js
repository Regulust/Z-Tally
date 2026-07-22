import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { TYPOGRAPHY } from "../../../utils/theme";
import { fitTextSize } from "../../../utils/text-layout";
import { applyStoredScreenBrightTime } from "../../../utils/screen-bright";

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
    applyStoredScreenBrightTime();
    const aboutLabel = text("about");
    const description = text("aboutDescription");
    const features = text("aboutFeatures");
    const version = text("version");
    const target = text("targetDevice");
    const developer = text("developer");
    hmUI.updateStatusBarTitle(aboutLabel);
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: 64, w: 390, h: 386, color: 0x000000 });
    addText(text("appName"), 20, 92, 350, 48, TYPOGRAPHY.title1);
    addText(description, 20, 144, 350, 40, fitTextSize(description, 350, TYPOGRAPHY.caption, 18), COLORS.textSecondaryInfo);
    addText(features, 20, 188, 350, 72, fitTextSize(features, 350, TYPOGRAPHY.caption, 18));
    addText(version, 20, 278, 350, 34, fitTextSize(version, 350, TYPOGRAPHY.caption, 18), COLORS.textSecondaryInfo);
    addText(target, 20, 318, 350, 34, fitTextSize(target, 350, TYPOGRAPHY.caption, 17), COLORS.textSecondaryInfo);
    addText(developer, 20, 358, 350, 34, fitTextSize(developer, 350, TYPOGRAPHY.caption, 17), COLORS.textSecondaryInfo);
  },

  onResume() {
    hmUI.updateStatusBarTitle(text("about"));
    applyStoredScreenBrightTime();
  },
});
