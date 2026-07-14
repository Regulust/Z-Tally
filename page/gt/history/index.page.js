import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { Vibrator, VIBRATOR_SCENE_SHORT_LIGHT } from "@zos/sensor";
import { COUNTER_IDS, HISTORY_LIMIT, loadState, saveState } from "../../../utils/state";

const COLORS = {
  background: 0x000000,
  sysWarning: 0xad3c23,
  sysWarningPressed: 0x7b2b19,
  sysButtonBg: 0x383838,
  sysButtonPressed: 0x282828,
  textTitle: 0xffffff,
  textButton: 0xffffff,
  textSecondaryInfo: 0x808080,
};

let pageState = null;
let widgets = [];
let vibrator = null;
let vibrationStopTimer = null;
let pendingDeleteId = null;

function text(key) {
  return getText(key) || key;
}

function localizedCounterName(counterId) {
  const index = COUNTER_IDS.indexOf(counterId);
  return text(index >= 0 ? `counter${index + 1}` : "counter");
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const pad = (value) => `${value}`.padStart(2, "0");
  return `${date.getMonth() + 1}/${date.getDate()}  ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function valueTextSize(value) {
  const digits = `${value}`.length;
  if (digits <= 4) return 42;
  if (digits <= 6) return 34;
  if (digits <= 8) return 28;
  return 24;
}

Page({
  onInit() {
    pageState = loadState();
    try {
      vibrator = new Vibrator();
    } catch (_error) {
      vibrator = null;
    }
  },

  build() {
    this.renderHistory();
  },

  onDestroy() {
    if (vibrationStopTimer) clearTimeout(vibrationStopTimer);
    try {
      if (vibrator) vibrator.stop();
    } catch (_error) {}
  },

  addWidget(type, options) {
    const widget = hmUI.createWidget(type, options);
    widgets.push(widget);
    return widget;
  },

  clearWidgets() {
    widgets.slice().reverse().forEach((widget) => {
      try {
        hmUI.deleteWidget(widget);
      } catch (_error) {}
    });
    widgets = [];
  },

  addText(value, x, y, w, h, size, color = COLORS.textTitle, align = hmUI.align.CENTER_H) {
    return this.addWidget(hmUI.widget.TEXT, {
      text: value,
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

  pulse() {
    if (!pageState.vibrationEnabled || !vibrator) return;
    try {
      vibrator.stop();
      vibrator.start({ mode: VIBRATOR_SCENE_SHORT_LIGHT });
      vibrationStopTimer = setTimeout(() => {
        vibrationStopTimer = null;
        try {
          vibrator.stop();
        } catch (_error) {}
      }, 30);
    } catch (_error) {}
  },

  renderHistory() {
    this.clearWidgets();
    pendingDeleteId = null;
    this.addText(text("history"), 136, 25, 208, 58, 34);
    this.addText(`${pageState.results.length}/${HISTORY_LIMIT}`, 298, 38, 82, 36, 18, COLORS.textSecondaryInfo);

    const list = this.addWidget(hmUI.widget.VIEW_CONTAINER, {
      x: 0,
      y: 92,
      w: 480,
      h: 388,
      scroll_enable: 1,
      bounce: 0,
    });

    if (pageState.results.length === 0) {
      list.createWidget(hmUI.widget.TEXT, {
        text: text("noSavedResults"),
        x: 40,
        y: 94,
        w: 400,
        h: 76,
        color: COLORS.textSecondaryInfo,
        text_size: 28,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
      });
    } else {
      pageState.results.forEach((item, index) => {
        const y = 6 + index * 104;
        list.createWidget(hmUI.widget.TEXT, {
          text: `${item.value}`,
          x: 34,
          y: y + 2,
          w: 122,
          h: 76,
          color: COLORS.textTitle,
          text_size: valueTextSize(item.value),
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text_style: hmUI.text_style.NONE,
        });
        list.createWidget(hmUI.widget.TEXT, {
          text: localizedCounterName(item.counterId),
          x: 158,
          y,
          w: 184,
          h: 38,
          color: COLORS.textTitle,
          text_size: 24,
          align_h: hmUI.align.LEFT,
          align_v: hmUI.align.CENTER_V,
        });
        list.createWidget(hmUI.widget.TEXT, {
          text: formatTime(item.savedAt),
          x: 158,
          y: y + 40,
          w: 184,
          h: 32,
          color: COLORS.textSecondaryInfo,
          text_size: 19,
          align_h: hmUI.align.LEFT,
          align_v: hmUI.align.CENTER_V,
        });
        list.createWidget(hmUI.widget.BUTTON, {
          text: "×",
          x: 354,
          y: y + 10,
          w: 68,
          h: 58,
          color: COLORS.textButton,
          text_size: 32,
          radius: 17,
          normal_color: COLORS.sysWarning,
          press_color: COLORS.sysWarningPressed,
          click_func: () => this.renderDeleteConfirm(item.id),
        });
      });
      list.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: pageState.results.length * 104 + 12,
        w: 480,
        h: 72,
        color: COLORS.background,
      });
    }

    if (pageState.results.length > 3) {
      this.addWidget(hmUI.widget.PAGE_SCROLLBAR, { target: list });
    }
  },

  renderDeleteConfirm(resultId) {
    pendingDeleteId = resultId;
    this.clearWidgets();
    this.addText(text("deleteConfirmTitle"), 50, 108, 380, 62, 36);
    this.addText(text("deleteConfirmDetail"), 55, 176, 370, 72, 23, COLORS.textSecondaryInfo);
    this.addWidget(hmUI.widget.BUTTON, {
      text: text("cancel"), x: 68, y: 280, w: 154, h: 70,
      color: COLORS.textButton, text_size: 26, radius: 20,
      normal_color: COLORS.sysButtonBg, press_color: COLORS.sysButtonPressed,
      click_func: () => this.renderHistory(),
    });
    this.addWidget(hmUI.widget.BUTTON, {
      text: text("confirm"), x: 258, y: 280, w: 154, h: 70,
      color: COLORS.textButton, text_size: 26, radius: 20,
      normal_color: COLORS.sysWarning, press_color: COLORS.sysWarningPressed,
      click_func: () => this.confirmDelete(),
    });
  },

  confirmDelete() {
    if (pendingDeleteId) {
      pageState.results = pageState.results.filter((item) => item.id !== pendingDeleteId);
      saveState(pageState);
      this.pulse();
    }
    this.renderHistory();
  },
});
