import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { push } from "@zos/router";
import { getDeviceInfo, SCREEN_SHAPE_SQUARE } from "@zos/device";
import { loadState, saveState, updateCounterValue } from "../utils/state";

const COLORS = {
  item: 0x303030,
  itemPressed: 0x222222,
  key: 0x0986d4,
  keyPressed: 0x066097,
  text: 0xffffff,
  disabledItem: 0x1d1d1d,
  disabledText: 0x5d5d5d,
};

const ROUND_LAYOUT = {
  square: false,
  title: { x: 0, y: 20, w: 480, h: 48, textSize: 36 },
  selector: { hitX: 80, hitY: 72, hitSize: 64, x: 92, y: 84, size: 40, step: 64, textSize: 24 },
  value: { x: 64, y: 140, w: 352, h: 220, radius: 42 },
  decrement: { x: 128, y: 400, w: 72, h: 48, radius: 16, textSize: 22 },
  open: { x: 212, y: 400, w: 140, h: 48, radius: 16, textSize: 22 },
};

const SQUARE_LAYOUT = {
  square: true,
  title: { x: 0, y: 18, w: 390, h: 42, textSize: 30 },
  selector: { hitX: 55, hitY: 68, hitSize: 56, x: 65, y: 78, size: 36, step: 56, textSize: 22 },
  value: { x: 32, y: 130, w: 326, h: 210, radius: 36 },
  decrement: { x: 93, y: 378, w: 60, h: 48, radius: 15, textSize: 21 },
  open: { x: 165, y: 378, w: 132, h: 48, radius: 15, textSize: 20 },
};

let state = null;
let layout = ROUND_LAYOUT;
let valueWidget = null;
let decrementWidget = null;
let selectorWidgets = [];

function text(key) {
  return getText(key) || key;
}

function activeCounter() {
  return state.counters.find((counter) => counter.id === state.activeCounterId) || state.counters[0];
}

function detectLayout() {
  try {
    const info = getDeviceInfo();
    if (info && (info.screenShape === SCREEN_SHAPE_SQUARE || info.width === 390)) return SQUARE_LAYOUT;
  } catch (_error) {}
  return ROUND_LAYOUT;
}

function valueSize(value) {
  const digits = `${value}`.length;
  if (layout.square) {
    if (digits <= 4) return 82;
    if (digits <= 6) return 66;
    if (digits <= 8) return 52;
    return 40;
  }
  if (digits <= 4) return 96;
  if (digits <= 6) return 76;
  if (digits <= 8) return 58;
  return 44;
}

function mainPageUrl() {
  return layout.square ? "page/square/home/index.page" : "page/round/home/index.page";
}

function selectorStyle(index, active) {
  const selector = layout.selector;
  return {
    text: `${index + 1}`,
    x: selector.x + index * selector.step,
    y: selector.y,
    w: selector.size,
    h: selector.size,
    color: COLORS.text,
    text_size: selector.textSize,
    radius: Math.round(selector.size / 2),
    normal_color: active ? COLORS.key : COLORS.item,
    press_color: active ? COLORS.keyPressed : COLORS.itemPressed,
  };
}

SecondaryWidget({
  onInit() {
    state = loadState();
    layout = detectLayout();
    selectorWidgets = [];
  },

  build() {
    state = state || loadState();
    layout = detectLayout();

    hmUI.createWidget(hmUI.widget.TEXT, {
      text: text("appName"),
      x: layout.title.x,
      y: layout.title.y,
      w: layout.title.w,
      h: layout.title.h,
      color: COLORS.text,
      text_size: layout.title.textSize,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE,
    });

    state.counters.forEach((counter, index) => {
      const selector = layout.selector;
      hmUI.createWidget(hmUI.widget.BUTTON, {
        text: "",
        x: selector.hitX + index * selector.step,
        y: selector.hitY,
        w: selector.hitSize,
        h: selector.hitSize,
        normal_color: 0x000000,
        press_color: 0x000000,
        click_func: () => this.selectCounter(counter.id),
      });
      selectorWidgets.push(hmUI.createWidget(hmUI.widget.BUTTON, {
        ...selectorStyle(index, counter.id === state.activeCounterId),
        click_func: () => this.selectCounter(counter.id),
      }));
    });

    const counter = activeCounter();
    valueWidget = hmUI.createWidget(hmUI.widget.BUTTON, {
      text: `${counter.value}`,
      x: layout.value.x,
      y: layout.value.y,
      w: layout.value.w,
      h: layout.value.h,
      color: COLORS.text,
      text_size: valueSize(counter.value),
      radius: layout.value.radius,
      normal_color: COLORS.item,
      press_color: COLORS.itemPressed,
      click_func: () => this.increment(),
    });

    decrementWidget = hmUI.createWidget(hmUI.widget.BUTTON, {
      text: "−1",
      x: layout.decrement.x,
      y: layout.decrement.y,
      w: layout.decrement.w,
      h: layout.decrement.h,
      color: counter.value > 0 ? COLORS.text : COLORS.disabledText,
      text_size: layout.decrement.textSize,
      radius: layout.decrement.radius,
      normal_color: counter.value > 0 ? COLORS.item : COLORS.disabledItem,
      press_color: COLORS.itemPressed,
      click_func: () => this.decrement(),
    });
    if (decrementWidget.setEnable) decrementWidget.setEnable(counter.value > 0);

    hmUI.createWidget(hmUI.widget.BUTTON, {
      text: text("openApp"),
      x: layout.open.x,
      y: layout.open.y,
      w: layout.open.w,
      h: layout.open.h,
      color: COLORS.text,
      text_size: layout.open.textSize,
      radius: layout.open.radius,
      normal_color: COLORS.key,
      press_color: COLORS.keyPressed,
      click_func: () => push({ url: mainPageUrl() }),
    });
  },

  onResume() {
    state = loadState();
    this.refresh();
  },

  selectCounter(counterId) {
    state = loadState();
    if (state.activeCounterId === counterId) return;
    state.activeCounterId = counterId;
    saveState(state);
    this.refresh();
  },

  increment() {
    state = updateCounterValue(state.activeCounterId, 1);
    this.refresh();
  },

  decrement() {
    if (activeCounter().value === 0) return;
    state = updateCounterValue(state.activeCounterId, -1);
    this.refresh();
  },

  refresh() {
    const counter = activeCounter();
    selectorWidgets.forEach((widget, index) => {
      widget.setProperty(hmUI.prop.MORE, {
        ...selectorStyle(index, state.counters[index].id === counter.id),
        click_func: () => this.selectCounter(state.counters[index].id),
      });
    });
    if (valueWidget) {
      valueWidget.setProperty(hmUI.prop.MORE, {
        text: `${counter.value}`,
        x: layout.value.x,
        y: layout.value.y,
        w: layout.value.w,
        h: layout.value.h,
        color: COLORS.text,
        text_size: valueSize(counter.value),
        radius: layout.value.radius,
        normal_color: COLORS.item,
        press_color: COLORS.itemPressed,
        click_func: () => this.increment(),
      });
    }
    if (decrementWidget) {
      decrementWidget.setProperty(hmUI.prop.MORE, {
        text: "−1",
        x: layout.decrement.x,
        y: layout.decrement.y,
        w: layout.decrement.w,
        h: layout.decrement.h,
        color: counter.value > 0 ? COLORS.text : COLORS.disabledText,
        text_size: layout.decrement.textSize,
        radius: layout.decrement.radius,
        normal_color: counter.value > 0 ? COLORS.item : COLORS.disabledItem,
        press_color: COLORS.itemPressed,
        click_func: () => this.decrement(),
      });
      if (decrementWidget.setEnable) decrementWidget.setEnable(counter.value > 0);
    }
  },
});
