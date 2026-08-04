import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { push } from "@zos/router";
import { getDeviceInfo, SCREEN_SHAPE_SQUARE } from "@zos/device";
import { Vibrator } from "@zos/sensor";
import { loadState, saveState } from "../utils/state";
import { HAPTIC_COUNT, playHaptic, stopHaptic } from "../utils/haptics";

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
let vibrator = null;
let persistTimer = null;
let stateDirty = false;
let renderedValueTextSize = null;
let decrementEnabled = null;

const PERSIST_DELAY = 300;

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
    try {
      vibrator = new Vibrator();
    } catch (_error) {
      vibrator = null;
    }
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
    renderedValueTextSize = valueSize(counter.value);
    valueWidget = hmUI.createWidget(hmUI.widget.BUTTON, {
      text: `${counter.value}`,
      x: layout.value.x,
      y: layout.value.y,
      w: layout.value.w,
      h: layout.value.h,
      color: COLORS.text,
      text_size: renderedValueTextSize,
      radius: layout.value.radius,
      normal_color: COLORS.item,
      press_color: COLORS.itemPressed,
      click_func: () => this.increment(),
    });

    decrementEnabled = counter.value > 0;
    decrementWidget = hmUI.createWidget(hmUI.widget.BUTTON, {
      text: "−1",
      x: layout.decrement.x,
      y: layout.decrement.y,
      w: layout.decrement.w,
      h: layout.decrement.h,
      color: decrementEnabled ? COLORS.text : COLORS.disabledText,
      text_size: layout.decrement.textSize,
      radius: layout.decrement.radius,
      normal_color: decrementEnabled ? COLORS.item : COLORS.disabledItem,
      press_color: COLORS.itemPressed,
      click_func: () => this.decrement(),
    });
    if (decrementWidget.setEnable) decrementWidget.setEnable(decrementEnabled);

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
      click_func: () => this.openApp(),
    });
  },

  onResume() {
    this.persistNow();
    state = loadState();
    this.refresh();
  },

  onPause() {
    this.persistNow();
  },

  onDestroy() {
    this.persistNow();
    stopHaptic(vibrator);
  },

  selectCounter(counterId) {
    this.persistNow();
    state = loadState();
    if (state.activeCounterId === counterId) return;
    state.activeCounterId = counterId;
    saveState(state);
    this.refresh();
  },

  openApp() {
    this.persistNow();
    push({ url: mainPageUrl() });
  },

  increment() {
    const counter = activeCounter();
    counter.value += 1;
    this.refreshValue(counter);
    this.schedulePersist();
    this.pulseCount();
  },

  decrement() {
    const counter = activeCounter();
    if (counter.value === 0) return;
    counter.value -= 1;
    this.refreshValue(counter);
    this.schedulePersist();
    this.pulseCount();
  },

  schedulePersist() {
    stateDirty = true;
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistTimer = null;
      this.persistNow();
    }, PERSIST_DELAY);
  },

  persistNow() {
    if (!state) return;
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    if (!stateDirty) return;
    try {
      saveState(state);
      stateDirty = false;
    } catch (_error) {}
  },

  pulseCount() {
    if (!state || !state.vibrationEnabled) return;
    playHaptic(vibrator, HAPTIC_COUNT);
  },

  refreshValue(counter, force = false) {
    const nextTextSize = valueSize(counter.value);
    if (valueWidget) {
      if (!force && renderedValueTextSize === nextTextSize) {
        valueWidget.setProperty(hmUI.prop.TEXT, `${counter.value}`);
      } else {
        valueWidget.setProperty(hmUI.prop.MORE, {
          text: `${counter.value}`,
          x: layout.value.x,
          y: layout.value.y,
          w: layout.value.w,
          h: layout.value.h,
          color: COLORS.text,
          text_size: nextTextSize,
          radius: layout.value.radius,
          normal_color: COLORS.item,
          press_color: COLORS.itemPressed,
          click_func: () => this.increment(),
        });
      }
      renderedValueTextSize = nextTextSize;
    }

    const nextDecrementEnabled = counter.value > 0;
    if (decrementWidget && (force || decrementEnabled !== nextDecrementEnabled)) {
      decrementWidget.setProperty(hmUI.prop.MORE, {
        text: "−1",
        x: layout.decrement.x,
        y: layout.decrement.y,
        w: layout.decrement.w,
        h: layout.decrement.h,
        color: nextDecrementEnabled ? COLORS.text : COLORS.disabledText,
        text_size: layout.decrement.textSize,
        radius: layout.decrement.radius,
        normal_color: nextDecrementEnabled ? COLORS.item : COLORS.disabledItem,
        press_color: COLORS.itemPressed,
        click_func: () => this.decrement(),
      });
      if (decrementWidget.setEnable) decrementWidget.setEnable(nextDecrementEnabled);
    }
    decrementEnabled = nextDecrementEnabled;
  },

  refresh() {
    const counter = activeCounter();
    selectorWidgets.forEach((widget, index) => {
      widget.setProperty(hmUI.prop.MORE, {
        ...selectorStyle(index, state.counters[index].id === counter.id),
        click_func: () => this.selectCounter(state.counters[index].id),
      });
    });
    this.refreshValue(counter, true);
  },
});
