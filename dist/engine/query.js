import { SPEC_KEYS } from "../api/types.js";
export function queryWidgets(spec, options) {
    const result = {
        areas: [],
        sticky_notes: [],
        textboxes: [],
        titles: [],
        shapes: [],
        arrows: [],
    };
    const keys = options.type ? [options.type] : SPEC_KEYS;
    // Resolve area filter: match by ID or by title
    let areaIds = null;
    if (options.area) {
        areaIds = new Set();
        for (const area of spec.areas) {
            const areaId = area.id;
            const areaTitle = area.title || "";
            if (areaId === options.area ||
                areaTitle.toLowerCase().includes(options.area.toLowerCase())) {
                areaIds.add(areaId);
            }
        }
    }
    for (const key of keys) {
        const widgets = spec[key];
        const filtered = widgets.filter((w) => {
            if (areaIds && !areaIds.has(String(w.parentId)))
                return false;
            if (options.text) {
                const searchText = options.text.toLowerCase();
                const htmlText = (w.htmlText || "").toLowerCase();
                const text = (w.text || "").toLowerCase();
                const title = (w.title || "").toLowerCase();
                if (!htmlText.includes(searchText) &&
                    !text.includes(searchText) &&
                    !title.includes(searchText)) {
                    return false;
                }
            }
            return true;
        });
        result[key] = filtered;
    }
    return result;
}
//# sourceMappingURL=query.js.map