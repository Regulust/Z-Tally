function glyphUnits(char) {
  const code = char.charCodeAt(0);
  if (char === " " || char === "\t") return 0.35;
  if ("ilI1.,:;!|'`".includes(char)) return 0.35;
  if ("MW@%&ЖШЩЮФ".includes(char)) return 0.9;
  if (code >= 0x2e80) return 1;
  if (code >= 0x0400 && code <= 0x04ff) return 0.66;
  return 0.6;
}

function widestLineUnits(value) {
  return `${value}`.split("\n").reduce((widest, line) => {
    const units = Array.from(line).reduce((total, char) => total + glyphUnits(char), 0);
    return Math.max(widest, units);
  }, 0);
}

// Uses a conservative glyph-width estimate so short controls stay single-line
// across Latin, Cyrillic, and CJK translations without device-specific fonts.
export function fitTextSize(value, width, preferredSize, minimumSize = 16, horizontalPadding = 16) {
  const units = widestLineUnits(value);
  if (!units) return preferredSize;
  const availableWidth = Math.max(1, width - horizontalPadding);
  return Math.max(minimumSize, Math.min(preferredSize, Math.floor(availableWidth / units)));
}
