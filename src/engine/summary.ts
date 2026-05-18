import type { BoardSpec, SpecKey } from "../api/types.js";
import { SPEC_KEYS } from "../api/types.js";

export interface BoardSummary {
  areas: { id: string; title: string; widgetCount: number }[];
  widgetCounts: Record<string, number>;
  tags: { id: string; text: string; color?: string }[];
  totalWidgets: number;
}

export function summarizeBoard(spec: BoardSpec): BoardSummary {
  const widgetCounts: Record<string, number> = {};
  let totalWidgets = 0;

  for (const key of SPEC_KEYS) {
    widgetCounts[key] = spec[key].length;
    totalWidgets += spec[key].length;
  }

  const areas = spec.areas.map((area) => {
    const areaId = area.id as string;
    let widgetCount = 0;
    for (const key of SPEC_KEYS) {
      if (key === "areas") continue;
      widgetCount += spec[key].filter(
        (w) => String(w.parentId) === areaId,
      ).length;
    }
    return {
      id: areaId,
      title: (area.title as string) || "(untitled)",
      widgetCount,
    };
  });

  // Tags are not separate widgets in the spec but we surface them from board metadata
  const tags: { id: string; text: string; color?: string }[] = [];

  return { areas, widgetCounts, tags, totalWidgets };
}
