import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { Vibrator, VIBRATOR_SCENE_SHORT_LIGHT } from "@zos/sensor";
import { push } from "@zos/router";
import {
  onKey,
  offKey,
  KEY_SELECT,
  KEY_SHORTCUT,
  KEY_EVENT_CLICK,
  MODAL_CONFIRM,
  createModal,
  showToast,
} from "@zos/interaction";
import { log as Logger } from "@zos/utils";
import { COUNTER_IDS, HISTORY_LIMIT, hasSeenTutorial, loadState, saveState } from "../../../utils/state";
import { TYPOGRAPHY } from "../../../utils/theme";
import { fitTextSize } from "../../../utils/text-layout";
import { applyScreenBrightTime } from "../../../utils/screen-bright";

const logger = Logger.getLogger("z-tally");
let vibrator = null;

let pageState = null;
let pageWidgets = [];
let currentView = "main";
let counterValueWidget = null;
let minusButtonWidget = null;
let saveButtonWidget = null;
let historyButtonWidget = null;
let persistTimer = null;
let vibrationStopTimer = null;
let incrementFromPhysicalKey = null;
let keyListenerRegistered = false;
let tutorialOpened = false;

const COLORS = {
  sysItemBg: 0x303030,
  sysItemPressed: 0x222222,
  sysButtonBg: 0x383838,
  sysButtonPressed: 0x282828,
  sysKey: 0x0986d4,
  sysKeyPressed: 0x066097,
  sysWarning: 0xad3c23,
  sysWarningPressed: 0x7b2b19,
  aux03: 0x399e5a,
  aux03Pressed: 0x287140,
  textTitle: 0xffffff,
  textButton: 0xffffff,
  textSecondaryInfo: 0x808080,
  textWarning: 0xd14221,
  disabled: 0x808080,
};

function text(key) {
  const translated = getText(key);
  return translated || key;
}

function formatText(key, replacements = {}) {
  return Object.keys(replacements).reduce(
    (result, name) => result.split(`{${name}}`).join(`${replacements[name]}`),
    text(key),
  );
}

function localizedCounterName(counterId) {
  const index = COUNTER_IDS.indexOf(counterId);
  return text(index >= 0 ? `counter${index + 1}` : "counter");
}

function counterTextSize(value) {
  const digits = `${value}`.length;
  if (digits <= 4) return 82;
  if (digits <= 6) return 68;
  if (digits <= 8) return 54;
  if (digits <= 10) return TYPOGRAPHY.largeTitle;
  return TYPOGRAPHY.title1;
}

Page({
  onInit() {
    try {
      vibrator = new Vibrator();
    } catch (error) {
      logger.error(`vibrator init failed: ${error}`);
    }
    pageState = loadState();
    pageWidgets = [];
    tutorialOpened = false;
  },

  build() {
    try {
      if (!vibrator) {
        try {
          vibrator = new Vibrator();
        } catch (error) {
          logger.error(`vibrator init in build failed: ${error}`);
        }
      }
      if (!pageState) pageState = loadState();
      if (!Array.isArray(pageWidgets)) pageWidgets = [];
      incrementFromPhysicalKey = () => this.changeValue(1);
      if (!keyListenerRegistered) {
        onKey({
          callback: (key, keyEvent) => {
            const isCountKey = key === KEY_SELECT || key === KEY_SHORTCUT;
            if (currentView === "main" && isCountKey && keyEvent === KEY_EVENT_CLICK) {
              if (incrementFromPhysicalKey) incrementFromPhysicalKey();
              return true;
            }
            return false;
          },
        });
        keyListenerRegistered = true;
      }
      this.applyScreenBrightTime();
      this.renderMain();
      if (!tutorialOpened && !hasSeenTutorial()) {
        tutorialOpened = true;
        setTimeout(() => push({ url: "page/round/tutorial/index.page" }), 0);
      }
    } catch (error) {
      logger.error(`page render failed: ${error}`);
      pageWidgets = pageWidgets || [];
      this.addWidget(hmUI.widget.TEXT, {
        text: `${text("errorTitle")}\n${error}`,
        x: 40,
        y: 120,
        w: 400,
        h: 220,
        color: COLORS.textWarning,
        text_size: TYPOGRAPHY.caption,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text_style: hmUI.text_style.WRAP,
      });
    }
  },

  onDestroy() {
    this.persistNow();
    if (vibrationStopTimer) {
      clearTimeout(vibrationStopTimer);
      vibrationStopTimer = null;
    }
    try {
      if (vibrator) vibrator.stop();
    } catch (error) {
      logger.warn(`vibration cleanup failed: ${error}`);
    }
    if (keyListenerRegistered) {
      try {
        offKey();
      } catch (error) {
        logger.warn(`key listener cleanup failed: ${error}`);
      }
      keyListenerRegistered = false;
    }
    incrementFromPhysicalKey = null;
  },

  onResume() {
    this.applyScreenBrightTime();
  },

  persistNow() {
    try {
      if (persistTimer) {
        clearTimeout(persistTimer);
        persistTimer = null;
      }
      saveState(pageState);
    } catch (error) {
      logger.error(`state save failed: ${error}`);
    }
  },

  schedulePersist() {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistTimer = null;
      this.persistNow();
    }, 300);
  },

  pulse() {
    try {
      if (!vibrator || !pageState || !pageState.vibrationEnabled) return;
      if (vibrationStopTimer) {
        clearTimeout(vibrationStopTimer);
        vibrationStopTimer = null;
      }
      vibrator.stop();
      vibrator.start({ mode: VIBRATOR_SCENE_SHORT_LIGHT });
      vibrationStopTimer = setTimeout(() => {
        vibrationStopTimer = null;
        try {
          vibrator.stop();
        } catch (error) {
          logger.warn(`vibration stop failed: ${error}`);
        }
      }, 30);
    } catch (error) {
      logger.warn(`vibration failed: ${error}`);
    }
  },

  activeCounter() {
    return pageState.counters.find((counter) => counter.id === pageState.activeCounterId) || pageState.counters[0];
  },

  clearWidgets() {
    if (!Array.isArray(pageWidgets)) {
      pageWidgets = [];
      return;
    }
    pageWidgets.slice().reverse().forEach((widget) => {
      try {
        hmUI.deleteWidget(widget);
      } catch (error) {
        logger.warn(`widget delete failed: ${error}`);
      }
    });
    pageWidgets = [];
    counterValueWidget = null;
    minusButtonWidget = null;
    saveButtonWidget = null;
    historyButtonWidget = null;
  },

  addWidget(type, options) {
    const widget = hmUI.createWidget(type, options);
    pageWidgets.push(widget);
    return widget;
  },

  addText(text, x, y, w, h, size, color = COLORS.textTitle, align = hmUI.align.CENTER_H) {
    return this.addWidget(hmUI.widget.TEXT, {
      text,
      x,
      y,
      w,
      h,
      color,
      text_size: size,
      align_h: align,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE,
    });
  },

  addButton({ text, x, y, w, h, onClick, color = COLORS.textButton, normal = COLORS.sysButtonBg, pressed = COLORS.sysButtonPressed, size = TYPOGRAPHY.subheadline, radius = 18 }) {
    return this.addWidget(hmUI.widget.BUTTON, {
      text,
      x,
      y,
      w,
      h,
      color,
      text_size: size,
      radius,
      normal_color: normal,
      press_color: pressed,
      click_func: onClick,
    });
  },

  selectCounter(counterId) {
    pageState.activeCounterId = counterId;
    this.persistNow();
    this.renderMain();
  },

  applyScreenBrightTime() {
    const result = applyScreenBrightTime(pageState.screenBrightTime);
    if (result !== 0) logger.warn(`screen bright time update failed: ${result}`);
  },

  changeValue(delta) {
    const counter = this.activeCounter();
    if (delta < 0 && counter.value === 0) return;
    counter.value = Math.max(0, counter.value + delta);
    this.schedulePersist();
    this.pulse();
    this.updateCounterControls();
  },

  updateCounterControls() {
    const counter = this.activeCounter();
    if (counterValueWidget) {
      counterValueWidget.setProperty(hmUI.prop.MORE, {
        text: `${counter.value}`,
        x: 56,
        y: 126,
        w: 368,
        h: 170,
        color: COLORS.textTitle,
        text_size: counterTextSize(counter.value),
        radius: 42,
        normal_color: COLORS.sysItemBg,
        press_color: COLORS.sysItemPressed,
        click_func: () => this.changeValue(1),
      });
    }
    if (minusButtonWidget) {
      minusButtonWidget.setProperty(hmUI.prop.MORE, {
        text: "−1",
        x: 62,
        y: 318,
        w: 104,
        h: 58,
        color: counter.value === 0 ? COLORS.disabled : COLORS.textButton,
        text_size: TYPOGRAPHY.subheadline,
        radius: 18,
        normal_color: COLORS.sysButtonBg,
        press_color: COLORS.sysButtonPressed,
        click_func: () => this.changeValue(-1),
      });
      if (minusButtonWidget.setEnable) minusButtonWidget.setEnable(counter.value > 0);
    }
    if (saveButtonWidget) {
      const saveLabel = text("save");
      saveButtonWidget.setProperty(hmUI.prop.MORE, {
        text: saveLabel,
        x: 188,
        y: 318,
        w: 104,
        h: 58,
        color: counter.value === 0 ? COLORS.disabled : COLORS.textButton,
        text_size: fitTextSize(saveLabel, 104, TYPOGRAPHY.caption, 15),
        radius: 18,
        normal_color: counter.value === 0 ? COLORS.sysButtonBg : COLORS.aux03,
        press_color: counter.value === 0 ? COLORS.sysButtonPressed : COLORS.aux03Pressed,
        click_func: () => this.saveResult(),
      });
      if (saveButtonWidget.setEnable) saveButtonWidget.setEnable(counter.value > 0);
    }
  },

  saveResult() {
    const counter = this.activeCounter();
    if (counter.value === 0) return;
    if (pageState.results.length >= HISTORY_LIMIT) {
      this.renderStorageFull();
      return;
    }
    pageState.results.unshift({
      id: `${Date.now()}-${counter.id}`,
      counterId: counter.id,
      value: counter.value,
      savedAt: Date.now(),
    });
    this.persistNow();
    this.pulse();
    if (historyButtonWidget) {
      const historyLabel = `${text("history")}  ${pageState.results.length}`;
      historyButtonWidget.setProperty(hmUI.prop.MORE, {
        text: historyLabel,
        x: 120,
        y: 398,
        w: 180,
        h: 52,
        color: COLORS.textButton,
        text_size: fitTextSize(historyLabel, 180, TYPOGRAPHY.caption, 18),
        radius: 18,
        normal_color: COLORS.sysButtonBg,
        press_color: COLORS.sysButtonPressed,
        click_func: () => push({ url: "page/round/history/index.page" }),
      });
    }
    showToast({ content: text("saved") });
  },

  requestReset() {
    const counter = this.activeCounter();
    if (counter.value === 0) return;
    const counterId = counter.id;
    currentView = "modal";
    createModal({
      content: `${text("resetConfirmTitle")}\n${formatText("resetConfirmDetail", { counter: localizedCounterName(counterId) })}`,
      onClick: ({ type }) => {
        currentView = "main";
        if (type !== MODAL_CONFIRM) return;
        const target = pageState.counters.find((item) => item.id === counterId);
        if (!target) return;
        target.value = 0;
        this.persistNow();
        this.pulse();
        this.updateCounterControls();
      },
    });
  },

  renderMain() {
    currentView = "main";
    this.clearWidgets();
    const counter = this.activeCounter();
    const saveLabel = text("save");
    const resetLabel = text("reset");
    const historyLabel = `${text("history")}  ${pageState.results.length}`;

    this.addText(text("appName"), 0, 18, 480, 48, TYPOGRAPHY.title);

    pageState.counters.forEach((item, index) => {
      const active = item.id === counter.id;
      this.addButton({
        text: `${index + 1}`,
        x: 104 + index * 92,
        y: 67,
        w: 72,
        h: 44,
        size: TYPOGRAPHY.caption,
        radius: 16,
        normal: active ? COLORS.sysKey : COLORS.sysButtonBg,
        pressed: active ? COLORS.sysKeyPressed : COLORS.sysButtonPressed,
        onClick: () => this.selectCounter(item.id),
      });
    });

    counterValueWidget = this.addButton({
      text: `${counter.value}`,
      x: 56,
      y: 126,
      w: 368,
      h: 170,
      size: counterTextSize(counter.value),
      radius: 42,
      normal: COLORS.sysItemBg,
      pressed: COLORS.sysItemPressed,
      onClick: () => this.changeValue(1),
    });
    minusButtonWidget = this.addButton({ text: "−1", x: 62, y: 318, w: 104, h: 58, size: TYPOGRAPHY.subheadline, onClick: () => this.changeValue(-1), color: counter.value === 0 ? COLORS.disabled : COLORS.textButton });
    if (minusButtonWidget.setEnable) minusButtonWidget.setEnable(counter.value > 0);
    saveButtonWidget = this.addButton({ text: saveLabel, x: 188, y: 318, w: 104, h: 58, size: fitTextSize(saveLabel, 104, TYPOGRAPHY.caption, 15), onClick: () => this.saveResult(), normal: counter.value === 0 ? COLORS.sysButtonBg : COLORS.aux03, pressed: counter.value === 0 ? COLORS.sysButtonPressed : COLORS.aux03Pressed, color: counter.value === 0 ? COLORS.disabled : COLORS.textButton });
    if (saveButtonWidget.setEnable) saveButtonWidget.setEnable(counter.value > 0);
    this.addButton({ text: resetLabel, x: 314, y: 318, w: 104, h: 58, size: fitTextSize(resetLabel, 104, TYPOGRAPHY.caption, 15), onClick: () => this.requestReset(), normal: COLORS.sysWarning, pressed: COLORS.sysWarningPressed });
    historyButtonWidget = this.addButton({ text: historyLabel, x: 120, y: 398, w: 180, h: 52, size: fitTextSize(historyLabel, 180, TYPOGRAPHY.caption, 18), onClick: () => push({ url: "page/round/history/index.page" }) });
    this.addWidget(hmUI.widget.BUTTON, {
      text: "",
      x: 308,
      y: 398,
      w: 52,
      h: 52,
      normal_src: "image/settings_normal.png",
      press_src: "image/settings_pressed.png",
      click_func: () => push({ url: "page/round/settings/index.page" }),
    });
  },

  renderStorageFull() {
    currentView = "storage-full";
    this.clearWidgets();
    const fullTitle = text("historyFullTitle");
    const fullDetail = text("historyFullDetail");
    const backLabel = text("back");
    const historyLabel = text("history");
    this.addText(fullTitle, 55, 105, 370, 58, fitTextSize(fullTitle, 370, TYPOGRAPHY.title, 24));
    this.addText(fullDetail, 60, 166, 360, 105, fitTextSize(fullDetail, 360, TYPOGRAPHY.caption, 18), COLORS.textSecondaryInfo);
    this.addButton({ text: backLabel, x: 70, y: 292, w: 150, h: 68, size: fitTextSize(backLabel, 150, TYPOGRAPHY.caption, 18), onClick: () => this.renderMain() });
    this.addButton({ text: historyLabel, x: 260, y: 292, w: 150, h: 68, size: fitTextSize(historyLabel, 150, TYPOGRAPHY.caption, 18), normal: COLORS.sysKey, pressed: COLORS.sysKeyPressed, onClick: () => push({ url: "page/round/history/index.page" }) });
  },

});
