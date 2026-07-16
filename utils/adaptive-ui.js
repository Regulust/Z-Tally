import { getDeviceInfo } from "@zos/device";

const ROUND_DESIGN_WIDTH = 480;
const ROUND_DESIGN_HEIGHT = 480;

function deviceScale() {
  try {
    const info = getDeviceInfo();
    return {
      x: info && info.width ? info.width / ROUND_DESIGN_WIDTH : 1,
      y: info && info.height ? info.height / ROUND_DESIGN_HEIGHT : 1,
    };
  } catch (_error) {
    return { x: 1, y: 1 };
  }
}

function scaled(value, factor) {
  return typeof value === "number" ? Math.round(value * factor) : value;
}

// The original 1.0 pages use a 480 x 480 coordinate system. This adapter keeps
// those pages unchanged while mapping them to the 390 x 450 square benchmark.
export function createAdaptiveUI(rawUI) {
  const scale = deviceScale();
  const uniform = Math.min(scale.x, scale.y);

  function mapOptions(options = {}) {
    const mapped = { ...options };
    ["x", "w", "center_x"].forEach((key) => {
      if (key in mapped) mapped[key] = scaled(mapped[key], scale.x);
    });
    ["y", "h", "center_y"].forEach((key) => {
      if (key in mapped) mapped[key] = scaled(mapped[key], scale.y);
    });
    ["radius", "text_size", "line_width"].forEach((key) => {
      if (key in mapped) mapped[key] = scaled(mapped[key], uniform);
    });
    if (mapped.target && mapped.target.__rawWidget) {
      mapped.target = mapped.target.__rawWidget;
    }
    return mapped;
  }

  function wrapWidget(rawWidget) {
    if (!rawWidget) return rawWidget;
    const wrapped = {
      __rawWidget: rawWidget,
      createWidget(type, options) {
        return wrapWidget(rawWidget.createWidget(type, mapOptions(options)));
      },
      setProperty(property, options) {
        return rawWidget.setProperty(property, mapOptions(options));
      },
    };
    if (rawWidget.setEnable) {
      wrapped.setEnable = (enabled) => rawWidget.setEnable(enabled);
    }
    return wrapped;
  }

  return {
    widget: rawUI.widget,
    align: rawUI.align,
    text_style: rawUI.text_style,
    prop: rawUI.prop,
    createWidget(type, options) {
      return wrapWidget(rawUI.createWidget(type, mapOptions(options)));
    },
    deleteWidget(widget) {
      return rawUI.deleteWidget(widget && widget.__rawWidget ? widget.__rawWidget : widget);
    },
  };
}
