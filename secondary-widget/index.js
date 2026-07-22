import * as rawUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { push } from "@zos/router";
import { getDeviceInfo, SCREEN_SHAPE_SQUARE } from "@zos/device";
import { COUNTER_IDS, loadState, saveState } from "../utils/state";
import { createAdaptiveUI } from "../utils/adaptive-ui";
import { fitTextSize } from "../utils/text-layout";

const hmUI = createAdaptiveUI(rawUI);
const COLORS = {
  item: 0x303030,
  itemPressed: 0x222222,
  key: 0x0986d4,
  keyPressed: 0x066097,
  text: 0xffffff,
  secondary: 0x808080,
};

let state = null;
let valueWidget = null;
let selectorWidgets = [];
let counterNameWidget = null;

function text(key) {
  return getText(key) || key;
}

function activeCounter() {
  return state.counters.find((counter) => counter.id === state.activeCounterId) || state.counters[0];
}

function counterName(counterId) {
  const index = COUNTER_IDS.indexOf(counterId);
  return text(index >= 0 ? `counter${index + 1}` : "counter");
}

function valueSize(value) {
  const digits = `${value}`.length;
  if (digits <= 4) return 96;
  if (digits <= 6) return 76;
  if (digits <= 8) return 58;
  return 44;
}

function mainPageUrl() {
  try {
    const info = getDeviceInfo();
    if (info && (info.screenShape === SCREEN_SHAPE_SQUARE || info.width === 390)) {
      return "page/square/home/index.page";
    }
  } catch (_error) {}
  return "page/round/home/index.page";
}

SecondaryWidget({
  onInit() {
    state = loadState();
    selectorWidgets = [];
  },

  build() {
    state = state || loadState();

    hmUI.createWidget(hmUI.widget.TEXT, {
      text: text("appName"),
      x: 0,
      y: 20,
      w: 480,
      h: 48,
      color: COLORS.text,
      text_size: 36,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    });

    state.counters.forEach((counter, index) => {
      selectorWidgets.push(hmUI.createWidget(hmUI.widget.BUTTON, {
        text: `${index + 1}`,
        x: 104 + index * 92,
        y: 78,
        w: 72,
        h: 44,
        color: COLORS.text,
        text_size: 24,
        radius: 16,
        normal_color: counter.id === state.activeCounterId ? COLORS.key : COLORS.item,
        press_color: counter.id === state.activeCounterId ? COLORS.keyPressed : COLORS.itemPressed,
        click_func: () => this.selectCounter(counter.id),
      }));
    });

    const counter = activeCounter();
    const counterLabel = `${counterName(counter.id)}  •  ${text("tapToCount")}`;
    const openAppLabel = text("openApp");
    valueWidget = hmUI.createWidget(hmUI.widget.BUTTON, {
      text: `${counter.value}`,
      x: 64,
      y: 148,
      w: 352,
      h: 212,
      color: COLORS.text,
      text_size: valueSize(counter.value),
      radius: 42,
      normal_color: COLORS.item,
      press_color: COLORS.itemPressed,
      click_func: () => this.increment(),
    });

    counterNameWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      text: counterLabel,
      x: 60,
      y: 374,
      w: 360,
      h: 42,
      color: COLORS.secondary,
      text_size: fitTextSize(counterLabel, 360, 24, 17),
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    });

    hmUI.createWidget(hmUI.widget.BUTTON, {
      text: openAppLabel,
      x: 170,
      y: 420,
      w: 140,
      h: 44,
      color: COLORS.text,
      text_size: fitTextSize(openAppLabel, 140, 22, 16),
      radius: 15,
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
    state.activeCounterId = counterId;
    saveState(state);
    this.refresh();
  },

  increment() {
    const counter = activeCounter();
    counter.value += 1;
    saveState(state);
    this.refresh();
  },

  refresh() {
    const counter = activeCounter();
    selectorWidgets.forEach((widget, index) => {
      const active = state.counters[index].id === counter.id;
      widget.setProperty(hmUI.prop.MORE, {
        text: `${index + 1}`,
        x: 104 + index * 92,
        y: 78,
        w: 72,
        h: 44,
        color: COLORS.text,
        text_size: 24,
        radius: 16,
        normal_color: active ? COLORS.key : COLORS.item,
        press_color: active ? COLORS.keyPressed : COLORS.itemPressed,
        click_func: () => this.selectCounter(state.counters[index].id),
      });
    });
    if (valueWidget) {
      valueWidget.setProperty(hmUI.prop.MORE, {
        text: `${counter.value}`,
        x: 64,
        y: 148,
        w: 352,
        h: 212,
        color: COLORS.text,
        text_size: valueSize(counter.value),
        radius: 42,
        normal_color: COLORS.item,
        press_color: COLORS.itemPressed,
        click_func: () => this.increment(),
      });
    }
    if (counterNameWidget) {
      const counterLabel = `${counterName(counter.id)}  •  ${text("tapToCount")}`;
      counterNameWidget.setProperty(hmUI.prop.MORE, {
        text: counterLabel,
        x: 60,
        y: 374,
        w: 360,
        h: 42,
        color: COLORS.secondary,
        text_size: fitTextSize(counterLabel, 360, 24, 17),
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
      });
    }
  },
});
