import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { back } from "@zos/router";
import { hasSeenTutorial, markTutorialSeen } from "../../../utils/state";
import { TYPOGRAPHY } from "../../../utils/theme";
import { fitTextSize } from "../../../utils/text-layout";
import { applyStoredScreenBrightTime } from "../../../utils/screen-bright";

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
    center_x: 52,
    center_y: y + 32,
    radius: 22,
    color: COLORS.sysKey,
  });
  addText(`${number}`, 30, y + 10, 44, 44, TYPOGRAPHY.caption);
  addText(
    value,
    88,
    y,
    282,
    64,
    TYPOGRAPHY.caption,
    COLORS.textTitle,
    hmUI.align.LEFT,
    hmUI.text_style.WRAP,
  );
}

Page({
  build() {
    applyStoredScreenBrightTime();
    const returningUser = hasSeenTutorial();
    const title = text("tutorialTitle");
    const action = text(returningUser ? "tutorialDone" : "tutorialStart");
    hmUI.updateStatusBarTitle(title);
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: 64, w: 390, h: 386, color: 0x000000 });

    addInstruction(1, text("tutorialCount"), 88);
    addInstruction(2, text("tutorialCounters"), 172);
    addInstruction(3, text("tutorialSave"), 256);

    hmUI.createWidget(hmUI.widget.BUTTON, {
      text: action,
      x: 95,
      y: 356,
      w: 200,
      h: 54,
      color: COLORS.textButton,
      text_size: fitTextSize(action, 200, TYPOGRAPHY.subheadline, 18),
      radius: 20,
      normal_color: COLORS.sysKey,
      press_color: COLORS.sysKeyPressed,
      click_func: () => {
        markTutorialSeen();
        back();
      },
    });
  },

  onResume() {
    hmUI.updateStatusBarTitle(text("tutorialTitle"));
    applyStoredScreenBrightTime();
  },
});
