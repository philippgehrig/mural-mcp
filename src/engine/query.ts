import type { BoardSpec, SpecKey, Widget } from "../api/types.js";
import { SPEC_KEYS } from "../api/types.js";

export interface QueryOptions {
  area?: string;
  type?: SpecKey;
  text?: string;
}

export function queryWidgets(spec: BoardSpec, options: QueryOptions): BoardSpec {
  const result: BoardSpec = {
    areas: [],
    sticky_notes: [],
    textboxes: [],
    titles: [],
    shapes: [],
    arrows: [],
  };

  const keys = options.type ? [options.type] : SPEC_KEYS;

  // Resolve area filter: match by ID or by title
  let areaIds: Set<string> | null = null;
  if (options.area) {
    areaIds = new Set<string>();
    for (const area of spec.areas) {
      const areaId = area.id as string;
      const areaTitle = (area.title as string) || "";
      if (
        areaId === options.area ||
        areaTitle.toLowerCase().includes(options.area.toLowerCase())
      ) {
        areaIds.add(areaId);
      }
    }
  }

  for (const key of keys) {
    const widgets = spec[key];
    const filtered = widgets.filter((w) => {
      if (areaIds && !areaIds.has(String(w.parentId))) return false;
      if (options.text) {
        const searchText = options.text.toLowerCase();
        const htmlText = ((w.htmlText as string) || "").toLowerCase();
        const text = ((w.text as string) || "").toLowerCase();
        const title = ((w.title as string) || "").toLowerCase();
        if (
          !htmlText.includes(searchText) &&
          !text.includes(searchText) &&
          !title.includes(searchText)
        ) {
          return false;
        }
      }
      return true;
    });
    result[key] = filtered;
  }

  return result;
}
