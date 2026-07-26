import { event, widget } from "@zos/ui";

const NORMAL_ALPHA = 255;
const PRESSED_ALPHA = 153;
const BACKGROUND_COLOR = 0x000000;

export function createInteractiveRow(parent, frame, clickFunc) {
  const foregroundWidgets = [];
  const button = parent.createWidget(widget.BUTTON, {
    ...frame,
    text: "",
    normal_color: BACKGROUND_COLOR,
    press_color: BACKGROUND_COLOR,
    click_func: clickFunc,
  });
  const group = parent.createWidget(widget.GROUP, frame);
  group.setEnable(false);

  const setForegroundAlpha = (alpha) => {
    foregroundWidgets.forEach((foregroundWidget) => {
      foregroundWidget.setAlpha(alpha);
    });
  };

  button.addEventListener(event.CLICK_DOWN, () => {
    setForegroundAlpha(PRESSED_ALPHA);
  });

  button.addEventListener(event.MOVE_OUT, () => {
    setForegroundAlpha(NORMAL_ALPHA);
  });

  button.addEventListener(event.CLICK_UP, () => {
    setForegroundAlpha(NORMAL_ALPHA);
  });

  return {
    createWidget(widgetType, options) {
      const foregroundWidget = group.createWidget(widgetType, options);
      foregroundWidget.setEnable(false);
      foregroundWidgets.push(foregroundWidget);
      return foregroundWidget;
    },
  };
}
