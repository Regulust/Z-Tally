import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { back } from "@zos/router";
import { hasSeenTutorial, markTutorialSeen } from "../../../utils/state";
import { TYPOGRAPHY } from "../../../utils/theme";

const COLORS = {
  sysKey: 0x0986d4,
  sysKeyPressed: 0x066097,
  textTitle: 0xffffff,
  textButton: 0xffffff,
  textSecondaryInfo: 0x808080,
};

function text(key) {
  return getText(key) || key;
}

function addText(value, x, y, w, h, size, color = COLORS.textTitle, align = hmUI.align.CENTER_H, style = hmUI.text_style.NONE) {
  return hmUI.createWidget(hmUI.widget.TEXT, {
    text: value,
    x,
    y,
    w,
    h,
    color,
    text_size: size,
    align_h: align,
    align_v: hmUI.align.CENTER_V,
    text_style: style,
  });
}

function addInstruction(number, value, y) {
  hmUI.createWidget(hmUI.widget.CIRCLE, {
    center_x: 82,
    center_y: y + 34,
    radius: 24,
    color: COLORS.sysKey,
  });
  addText(`${number}`, 58, y + 10, 48, 48, TYPOGRAPHY.caption);
  addText(
    value,
    124,
    y,
    290,
    68,
    TYPOGRAPHY.caption,
    COLORS.textTitle,
    hmUI.align.LEFT,
    hmUI.text_style.WRAP,
  );
}

Page({
  build() {
    const returningUser = hasSeenTutorial();
    addText(text("tutorialTitle"), 0, 24, 480, 52, TYPOGRAPHY.title);
    addText("Z-Tally", 0, 72, 480, 36, TYPOGRAPHY.caption, COLORS.textSecondaryInfo);

    addInstruction(1, text("tutorialCount"), 116);
    addInstruction(2, text("tutorialCounters"), 202);
    addInstruction(3, text("tutorialSave"), 288);

    hmUI.createWidget(hmUI.widget.BUTTON, {
      text: text(returningUser ? "tutorialDone" : "tutorialStart"),
      x: 130,
      y: 392,
      w: 220,
      h: 58,
      color: COLORS.textButton,
      text_size: TYPOGRAPHY.subheadline,
      radius: 20,
      normal_color: COLORS.sysKey,
      press_color: COLORS.sysKeyPressed,
      click_func: () => {
        markTutorialSeen();
        back();
      },
    });
  },
});
