import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { MODAL_CONFIRM, createModal } from "@zos/interaction";
import { Vibrator, VIBRATOR_SCENE_SHORT_LIGHT } from "@zos/sensor";
import { COUNTER_IDS, HISTORY_LIMIT, loadState, saveState } from "../../../utils/state";
import { TYPOGRAPHY } from "../../../utils/theme";

const COLORS = {
  background: 0x000000,
  sysWarning: 0xad3c23,
  sysWarningPressed: 0x7b2b19,
  textTitle: 0xffffff,
  textButton: 0xffffff,
  textSecondaryInfo: 0x808080,
};

let pageState = null;
let widgets = [];
let vibrator = null;
let vibrationStopTimer = null;

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
  if (digits <= 2) return TYPOGRAPHY.largeTitle;
  if (digits <= 3) return TYPOGRAPHY.title1;
  if (digits <= 4) return TYPOGRAPHY.body;
  if (digits <= 6) return TYPOGRAPHY.subheadline;
  return TYPOGRAPHY.caption;
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

  onResume() {
    hmUI.updateStatusBarTitle(text("history"));
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
    hmUI.updateStatusBarTitle(text("history"));
    this.addWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 64,
      w: 390,
      h: 386,
      color: COLORS.background,
    });
    const list = this.addWidget(hmUI.widget.VIEW_CONTAINER, {
      x: 0,
      y: 64,
      w: 390,
      h: 386,
      scroll_enable: 1,
      bounce: 0,
    });
    list.createWidget(hmUI.widget.TEXT, {
      text: `${pageState.results.length} / ${HISTORY_LIMIT}`,
      x: 0,
      y: 16,
      w: 390,
      h: 28,
      color: COLORS.textSecondaryInfo,
      text_size: TYPOGRAPHY.caption,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE,
    });

    if (pageState.results.length === 0) {
      list.createWidget(hmUI.widget.TEXT, {
        text: text("noSavedResults"),
        x: 20,
        y: 104,
        w: 350,
        h: 76,
        color: COLORS.textSecondaryInfo,
        text_size: TYPOGRAPHY.subheadline,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
      });
    } else {
      pageState.results.forEach((item, index) => {
        const y = 50 + index * 92;
        list.createWidget(hmUI.widget.TEXT, {
          text: `${item.value}`,
          x: 16,
          y: y + 2,
          w: 78,
          h: 68,
          color: COLORS.textTitle,
          text_size: valueTextSize(item.value),
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text_style: hmUI.text_style.NONE,
        });
        list.createWidget(hmUI.widget.TEXT, {
          text: localizedCounterName(item.counterId),
          x: 104,
          y,
          w: 174,
          h: 34,
          color: COLORS.textTitle,
          text_size: TYPOGRAPHY.caption,
          align_h: hmUI.align.LEFT,
          align_v: hmUI.align.CENTER_V,
        });
        list.createWidget(hmUI.widget.TEXT, {
          text: formatTime(item.savedAt),
          x: 104,
          y: y + 36,
          w: 174,
          h: 30,
          color: COLORS.textSecondaryInfo,
          text_size: TYPOGRAPHY.caption,
          align_h: hmUI.align.LEFT,
          align_v: hmUI.align.CENTER_V,
        });
        list.createWidget(hmUI.widget.BUTTON, {
          text: "×",
          x: 306,
          y: y + 7,
          w: 64,
          h: 56,
          color: COLORS.textButton,
          text_size: TYPOGRAPHY.body,
          radius: 17,
          normal_color: COLORS.sysWarning,
          press_color: COLORS.sysWarningPressed,
          click_func: () => this.requestDelete(item.id),
        });
      });
      list.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 50 + pageState.results.length * 92 + 12,
        w: 390,
        h: 80,
        color: COLORS.background,
      });
    }

    if (pageState.results.length > 3) {
      this.addWidget(hmUI.widget.PAGE_SCROLLBAR, { target: list });
    }
  },

  requestDelete(resultId) {
    createModal({
      content: `${text("deleteConfirmTitle")}\n${text("deleteConfirmDetail")}`,
      onClick: ({ type }) => {
        if (type !== MODAL_CONFIRM) return;
        pageState.results = pageState.results.filter((item) => item.id !== resultId);
        saveState(pageState);
        this.pulse();
        this.renderHistory();
      },
    });
  },
});
