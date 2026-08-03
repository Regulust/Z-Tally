import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { push } from "@zos/router";
import { getDeviceInfo, SCREEN_SHAPE_SQUARE } from "@zos/device";
import { COUNTER_IDS, loadState, saveState } from "../utils/state";
import { fitTextSize } from "../utils/text-layout";

const COLORS = {
  item: 0x303030,
  itemPressed: 0x222222,
  key: 0x0986d4,
  keyPressed: 0x066097,
  minusKey: 0x505050,
  minusKeyPressed: 0x383838,
  text: 0xffffff,
  secondary: 0xb3b3b3,
  disabledItem: 0x383838,
  disabledText: 0x707070,
};

let state = null;
let metrics = null;
let labelWidget = null;
let valueWidget = null;
let decrementWidget = null;
let isSquare = false;
let persistTimer = null;
let stateDirty = false;
let renderedValueTextSize = null;
let decrementEnabled = null;

const PERSIST_DELAY = 150;

function text(key) {
  return getText(key) || key;
}

function counterName(counterId) {
  const index = COUNTER_IDS.indexOf(counterId);
  return text(index >= 0 ? `counter${index + 1}` : "counter1");
}

function boundCounter() {
  const counterId = COUNTER_IDS.includes(state.quickCardCounterId)
    ? state.quickCardCounterId
    : COUNTER_IDS[0];
  return state.counters.find((counter) => counter.id === counterId) || state.counters[0];
}

function detectDevice() {
  try {
    const info = getDeviceInfo();
    isSquare = Boolean(info && (info.screenShape === SCREEN_SHAPE_SQUARE || info.width === 390));
    return info || {};
  } catch (_error) {
    isSquare = false;
    return {};
  }
}

function prepareMetrics() {
  const device = detectDevice();
  const desiredHeight = 170;
  try {
    hmUI.setAppWidgetSize({ h: desiredHeight });
  } catch (_error) {}

  let size = {};
  try {
    size = hmUI.getAppWidgetSize() || {};
  } catch (_error) {}
  const w = size.w || Math.min(400, Math.max(300, (device.width || 480) - 32));
  const h = desiredHeight;
  const screenWidth = device.width || w;
  const originX = Number.isFinite(size.margin)
    ? size.margin
    : Math.max(0, Math.round((screenWidth - w) / 2));
  const padding = 16;
  const actionHeight = 72;
  const plusWidth = 72;
  const minusWidth = 72;
  const actionGap = 8;
  const columnGap = 10;
  const contentX = originX + padding;
  const plusX = originX + w - padding - plusWidth;
  const minusX = plusX - actionGap - minusWidth;
  const actionY = h - padding - actionHeight;
  const leftWidth = minusX - columnGap - contentX;
  const valueInset = 14;
  const labelY = 24;
  const labelHeight = 35;
  const valueY = actionY + Math.round((actionHeight - 48) / 2);
  return {
    w,
    h,
    originX,
    contentX,
    padding,
    cardRadius: 36,
    actionHeight,
    actionGap,
    columnGap,
    plusWidth,
    minusWidth,
    plusX,
    minusX,
    actionY,
    leftWidth,
    valueX: contentX + valueInset,
    valueWidth: Math.max(1, leftWidth - valueInset),
    labelY,
    labelHeight,
    valueY,
    valueHeight: 48,
  };
}

function valueTextSize(value) {
  const digits = `${value}`.length;
  const base = 48;
  if (digits <= 4) return base;
  if (digits <= 6) return 42;
  if (digits <= 8) return 36;
  return 30;
}

function mainPageUrl() {
  return isSquare ? "page/square/home/index.page" : "page/round/home/index.page";
}

AppWidget({
  onInit() {
    state = loadState();
    metrics = prepareMetrics();
  },

  build() {
    state = state || loadState();
    metrics = metrics || prepareMetrics();
    const counter = boundCounter();
    const label = counterName(counter.id);

    hmUI.createWidget(hmUI.widget.BUTTON, {
      text: "",
      x: metrics.originX,
      y: 0,
      w: metrics.w,
      h: metrics.h,
      color: COLORS.item,
      text_size: 1,
      radius: metrics.cardRadius,
      normal_color: COLORS.item,
      press_color: COLORS.itemPressed,
      click_func: () => this.openApp(),
    });

    labelWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      text: label,
      x: metrics.contentX,
      y: metrics.labelY,
      w: metrics.leftWidth,
      h: metrics.labelHeight,
      color: COLORS.secondary,
      text_size: fitTextSize(label, metrics.leftWidth, 28, 18, 0),
      align_h: hmUI.align.LEFT,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE,
    });
    if (labelWidget.setEnable) labelWidget.setEnable(false);

    renderedValueTextSize = valueTextSize(counter.value);
    valueWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      text: `${counter.value}`,
      x: metrics.valueX,
      y: metrics.valueY,
      w: metrics.valueWidth,
      h: metrics.valueHeight,
      color: COLORS.text,
      text_size: renderedValueTextSize,
      align_h: hmUI.align.LEFT,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE,
    });
    if (valueWidget.setEnable) valueWidget.setEnable(false);

    hmUI.createWidget(hmUI.widget.BUTTON, {
      text: "+",
      x: metrics.plusX,
      y: metrics.actionY,
      w: metrics.plusWidth,
      h: metrics.actionHeight,
      color: COLORS.text,
      text_size: 40,
      radius: 18,
      normal_color: COLORS.key,
      press_color: COLORS.keyPressed,
      click_func: () => this.changeValue(1),
    });

    decrementEnabled = counter.value > 0;
    decrementWidget = hmUI.createWidget(hmUI.widget.BUTTON, {
      text: "−",
      x: metrics.minusX,
      y: metrics.actionY,
      w: metrics.minusWidth,
      h: metrics.actionHeight,
      color: decrementEnabled ? COLORS.text : COLORS.disabledText,
      text_size: 36,
      radius: 18,
      normal_color: decrementEnabled ? COLORS.minusKey : COLORS.disabledItem,
      press_color: COLORS.minusKeyPressed,
      click_func: () => this.changeValue(-1),
    });
    if (decrementWidget.setEnable) decrementWidget.setEnable(decrementEnabled);
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
  },

  openApp() {
    const counter = boundCounter();
    state.activeCounterId = counter.id;
    stateDirty = true;
    this.persistNow();
    push({ url: mainPageUrl() });
  },

  changeValue(delta) {
    const counter = boundCounter();
    if (delta < 0 && counter.value === 0) return;
    counter.value = Math.max(0, counter.value + delta);
    this.refreshValue(counter);
    this.schedulePersist();
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

  refreshValue(counter, force = false) {
    const nextTextSize = valueTextSize(counter.value);
    if (valueWidget) {
      if (!force && renderedValueTextSize === nextTextSize) {
        valueWidget.setProperty(hmUI.prop.TEXT, `${counter.value}`);
      } else {
        valueWidget.setProperty(hmUI.prop.MORE, {
          text: `${counter.value}`,
          x: metrics.valueX,
          y: metrics.valueY,
          w: metrics.valueWidth,
          h: metrics.valueHeight,
          color: COLORS.text,
          text_size: nextTextSize,
          align_h: hmUI.align.LEFT,
          align_v: hmUI.align.CENTER_V,
          text_style: hmUI.text_style.NONE,
        });
      }
      renderedValueTextSize = nextTextSize;
    }

    const nextDecrementEnabled = counter.value > 0;
    if (decrementWidget && (force || decrementEnabled !== nextDecrementEnabled)) {
      decrementWidget.setProperty(hmUI.prop.MORE, {
        text: "−",
        x: metrics.minusX,
        y: metrics.actionY,
        w: metrics.minusWidth,
        h: metrics.actionHeight,
        color: nextDecrementEnabled ? COLORS.text : COLORS.disabledText,
        text_size: 36,
        radius: 18,
        normal_color: nextDecrementEnabled ? COLORS.minusKey : COLORS.disabledItem,
        press_color: COLORS.minusKeyPressed,
        click_func: () => this.changeValue(-1),
      });
      if (decrementWidget.setEnable) decrementWidget.setEnable(nextDecrementEnabled);
    }
    decrementEnabled = nextDecrementEnabled;
  },

  refresh() {
    const counter = boundCounter();
    const label = counterName(counter.id);
    if (labelWidget) {
      labelWidget.setProperty(hmUI.prop.MORE, {
        text: label,
        x: metrics.contentX,
        y: metrics.labelY,
        w: metrics.leftWidth,
        h: metrics.labelHeight,
        color: COLORS.secondary,
        text_size: fitTextSize(label, metrics.leftWidth, 28, 18, 0),
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text_style: hmUI.text_style.NONE,
      });
    }
    this.refreshValue(counter, true);
  },
});
