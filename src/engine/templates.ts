import type { BoardSpec, Widget } from "../api/types.js";
import { STICKY_COLORS } from "./palettes.js";
import { PADDING, AREA_TITLE_HEIGHT, DEFAULT_WIDTH, DEFAULT_HEIGHT } from "./placement.js";

function kanbanLayout(
  columns: Record<string, Widget[]>,
  columnWidth: number,
): BoardSpec {
  const spec: BoardSpec = {
    areas: [],
    sticky_notes: [],
    textboxes: [],
    titles: [],
    shapes: [],
    arrows: [],
  };

  const gap = 40;
  const areaHeight = 600;
  const entries = Object.entries(columns);

  for (let i = 0; i < entries.length; i++) {
    const [name, stickies] = entries[i];
    const ax = i * (columnWidth + gap);

    spec.areas.push({
      x: ax,
      y: 0,
      width: columnWidth,
      height: areaHeight,
      title: name,
    });

    for (const sticky of stickies) {
      spec.sticky_notes.push({
        ...sticky,
        parentId: i,
        x: sticky.x ?? PADDING,
        y: sticky.y ?? AREA_TITLE_HEIGHT + PADDING,
        width: sticky.width ?? DEFAULT_WIDTH,
        height: sticky.height ?? DEFAULT_HEIGHT,
      });
    }
  }

  return spec;
}

function retroTemplate(options: {
  title?: string;
  columns?: string[];
} = {}): BoardSpec {
  const title = options.title || "Retrospective";
  const columns = options.columns || ["Went Well", "To Improve", "Action Items"];
  const colors = [
    STICKY_COLORS.light_green,
    STICKY_COLORS.light_red,
    STICKY_COLORS.light_blue,
    STICKY_COLORS.yellow,
    STICKY_COLORS.lavender,
  ];

  const colData: Record<string, Widget[]> = {};
  for (let i = 0; i < columns.length; i++) {
    const color = colors[i % colors.length];
    colData[columns[i]] = [{
      htmlText: `<i>Add ${columns[i].toLowerCase()} items here</i>`,
      shape: "rectangle",
      style: { backgroundColor: color },
    }];
  }

  const spec = kanbanLayout(colData, 500);
  spec.titles.push({ x: 0, y: -60, text: title, style: { fontSize: 36 } });
  return spec;
}

function kanbanTemplate(options: {
  title?: string;
  columns?: string[];
} = {}): BoardSpec {
  const title = options.title || "Kanban Board";
  const columns = options.columns || ["To Do", "In Progress", "Review", "Done"];
  const colors = [
    STICKY_COLORS.light_blue,
    STICKY_COLORS.yellow,
    STICKY_COLORS.light_orange,
    STICKY_COLORS.light_green,
    STICKY_COLORS.lavender,
  ];

  const colData: Record<string, Widget[]> = {};
  for (let i = 0; i < columns.length; i++) {
    const color = colors[i % colors.length];
    colData[columns[i]] = [{
      htmlText: "<i>Add tasks here</i>",
      shape: "rectangle",
      style: { backgroundColor: color },
    }];
  }

  const spec = kanbanLayout(colData, 450);
  spec.titles.push({ x: 0, y: -60, text: title, style: { fontSize: 36 } });
  return spec;
}

function brainstormTemplate(options: {
  title?: string;
  topics?: string[];
} = {}): BoardSpec {
  const title = options.title || "Brainstorming";
  const topics = options.topics || ["Topic 1", "Topic 2", "Topic 3", "Topic 4"];
  const colors = [
    STICKY_COLORS.light_yellow,
    STICKY_COLORS.light_blue,
    STICKY_COLORS.light_green,
    STICKY_COLORS.light_pink,
    STICKY_COLORS.lavender,
    STICKY_COLORS.light_orange,
  ];

  const areaW = 600, areaH = 500, gap = 40;
  const cols = Math.min(topics.length, 3);

  const spec: BoardSpec = {
    areas: [],
    sticky_notes: [],
    textboxes: [],
    titles: [],
    shapes: [],
    arrows: [],
  };

  for (let i = 0; i < topics.length; i++) {
    const [row, col] = [Math.floor(i / cols), i % cols];
    const ax = col * (areaW + gap);
    const ay = row * (areaH + gap);
    const color = colors[i % colors.length];

    spec.areas.push({ x: ax, y: ay, width: areaW, height: areaH, title: topics[i] });
    spec.sticky_notes.push({
      parentId: i,
      x: PADDING,
      y: AREA_TITLE_HEIGHT + PADDING,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      htmlText: `<i>Add ideas for ${topics[i]}</i>`,
      shape: "rectangle",
      style: { backgroundColor: color },
    });
  }

  spec.titles.push({ x: 0, y: -60, text: title, style: { fontSize: 36 } });
  return spec;
}

function swotTemplate(options: { title?: string } = {}): BoardSpec {
  const title = options.title || "SWOT Analysis";
  const labels = ["Strengths", "Weaknesses", "Opportunities", "Threats"];
  const colors = [
    STICKY_COLORS.light_green,
    STICKY_COLORS.light_red,
    STICKY_COLORS.light_blue,
    STICKY_COLORS.light_orange,
  ];

  const areaW = 600, areaH = 500, gap = 40;

  const spec: BoardSpec = {
    areas: [],
    sticky_notes: [],
    textboxes: [],
    titles: [],
    shapes: [],
    arrows: [],
  };

  for (let i = 0; i < labels.length; i++) {
    const [row, col] = [Math.floor(i / 2), i % 2];
    spec.areas.push({
      x: col * (areaW + gap),
      y: row * (areaH + gap),
      width: areaW,
      height: areaH,
      title: labels[i],
    });
    spec.sticky_notes.push({
      parentId: i,
      x: PADDING,
      y: AREA_TITLE_HEIGHT + PADDING,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      htmlText: `<i>Add ${labels[i].toLowerCase()} here</i>`,
      shape: "rectangle",
      style: { backgroundColor: colors[i] },
    });
  }

  spec.titles.push({ x: 0, y: -60, text: title, style: { fontSize: 36 } });
  return spec;
}

function sprintPlanningTemplate(options: {
  title?: string;
  stories?: string[];
} = {}): BoardSpec {
  const title = options.title || "Sprint Planning";
  const stories = options.stories || ["Story 1", "Story 2", "Story 3"];

  const colData: Record<string, Widget[]> = {};
  const color = STICKY_COLORS.yellow;
  for (const story of stories) {
    colData[story] = [{
      htmlText: "<i>Break down tasks here</i>",
      shape: "rectangle",
      style: { backgroundColor: color },
    }];
  }

  const spec = kanbanLayout(colData, 500);
  spec.titles.push({ x: 0, y: -60, text: title, style: { fontSize: 36 } });
  return spec;
}

const TEMPLATES: Record<string, (options?: any) => BoardSpec> = {
  retro: retroTemplate,
  kanban: kanbanTemplate,
  brainstorm: brainstormTemplate,
  swot: swotTemplate,
  sprint_planning: sprintPlanningTemplate,
};

export function templateNames(): string[] {
  return Object.keys(TEMPLATES).sort();
}

export function loadTemplate(name: string, options: Record<string, unknown> = {}): BoardSpec {
  const factory = TEMPLATES[name];
  if (!factory) {
    const available = Object.keys(TEMPLATES).sort().join(", ");
    throw new Error(`Unknown template: "${name}". Available: ${available}`);
  }
  return factory(options);
}
