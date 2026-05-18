export const STICKY_COLORS: Record<string, string> = {
  yellow: "#FCF281FF",
  light_yellow: "#FFF6B5FF",
  orange: "#F5A623FF",
  light_orange: "#FFD18CFF",
  peach: "#FFCBA5FF",
  red: "#F26C6CFF",
  light_red: "#FF9D9DFF",
  pink: "#FF87B2FF",
  light_pink: "#FFC2D4FF",
  magenta: "#E56DB1FF",
  purple: "#C17FEAFF",
  light_purple: "#D7A9F5FF",
  lavender: "#E8D5F5FF",
  blue: "#6EC6EAFF",
  light_blue: "#BBDFF5FF",
  dark_blue: "#4888C8FF",
  sky: "#A8D8F0FF",
  green: "#97D584FF",
  light_green: "#D5F692FF",
  dark_green: "#5FB57DFF",
  mint: "#B2ECD2FF",
  teal: "#5ECBC8FF",
  gray: "#D0D0D0FF",
  light_gray: "#E8E8E8FF",
  dark_gray: "#9E9E9EFF",
  white: "#FFFFFFFF",
};

export const AREA_COLORS: Record<string, string> = {
  light_yellow: "#FFF9E0FF",
  light_orange: "#FFF0E0FF",
  light_red: "#FFE0E0FF",
  light_pink: "#FFE0F0FF",
  light_purple: "#F0E0FFFF",
  light_blue: "#E0F0FFFF",
  light_green: "#E0FFE8FF",
  light_gray: "#F5F5F5FF",
  white: "#FFFFFFFF",
};

const PALETTES: Record<string, Record<string, string>> = {
  status: {
    done: "#D5F692FF",
    in_progress: "#FCF281FF",
    to_do: "#BBDFF5FF",
    blocked: "#F26C6CFF",
    review: "#FFD18CFF",
  },
  priority: {
    critical: "#F26C6CFF",
    high: "#F5A623FF",
    medium: "#FCF281FF",
    low: "#D5F692FF",
    none: "#E8E8E8FF",
  },
  category: {
    idea: "#FCF281FF",
    question: "#6EC6EAFF",
    action: "#D5F692FF",
    issue: "#F26C6CFF",
    note: "#E8D5F5FF",
    feedback: "#FFD18CFF",
  },
  sentiment: {
    positive: "#D5F692FF",
    neutral: "#FCF281FF",
    negative: "#F26C6CFF",
  },
  retro: {
    went_well: "#D5F692FF",
    improve: "#FF9D9DFF",
    action: "#BBDFF5FF",
    question: "#FCF281FF",
  },
  swot: {
    strength: "#D5F692FF",
    weakness: "#FF9D9DFF",
    opportunity: "#BBDFF5FF",
    threat: "#FFD18CFF",
  },
};

export function getPalette(name: string): Record<string, string> {
  const p = PALETTES[name];
  if (!p) {
    const available = Object.keys(PALETTES).sort().join(", ");
    throw new Error(`Unknown palette: "${name}". Available: ${available}`);
  }
  return { ...p };
}

export function paletteNames(): string[] {
  return Object.keys(PALETTES).sort();
}

export function autoColor(
  items: Record<string, unknown>[],
  paletteName: string,
  defaultColor = "#FCF281FF",
): Record<string, unknown>[] {
  const colors = Object.values(getPalette(paletteName));
  let colorIdx = 0;

  return items.map((item) => {
    const result = { ...item };
    const style = { ...(result.style as Record<string, unknown> || {}) };
    if (!style.backgroundColor) {
      style.backgroundColor = colors[colorIdx % colors.length];
      colorIdx++;
    }
    result.style = style;
    return result;
  });
}
