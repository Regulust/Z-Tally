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
    addText(aboutLabel, 136, 24, 208, 62, fitTextSize(aboutLabel, 208, TYPOGRAPHY.title, 22));
    addText(text("appName"), 76, 108, 328, 58, TYPOGRAPHY.title1);
    addText(description, 48, 168, 384, 46, fitTextSize(description, 384, TYPOGRAPHY.caption, 18), COLORS.textSecondaryInfo);
    addText(features, 54, 216, 372, 78, fitTextSize(features, 372, TYPOGRAPHY.caption, 18));
    addText(version, 76, 310, 328, 38, fitTextSize(version, 328, TYPOGRAPHY.caption, 18), COLORS.textSecondaryInfo);
    addText(target, 76, 352, 328, 38, fitTextSize(target, 328, TYPOGRAPHY.caption, 17), COLORS.textSecondaryInfo);
    addText(developer, 76, 394, 328, 38, fitTextSize(developer, 328, TYPOGRAPHY.caption, 17), COLORS.textSecondaryInfo);
  },

  onResume() {
    applyStoredScreenBrightTime();
  },
});
