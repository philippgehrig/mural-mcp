import { SPEC_KEYS } from "../api/types.js";
export function summarizeBoard(spec) {
    const widgetCounts = {};
    let totalWidgets = 0;
    for (const key of SPEC_KEYS) {
        widgetCounts[key] = spec[key].length;
        totalWidgets += spec[key].length;
    }
    const areas = spec.areas.map((area) => {
        const areaId = area.id;
        let widgetCount = 0;
        for (const key of SPEC_KEYS) {
            if (key === "areas")
                continue;
            widgetCount += spec[key].filter((w) => String(w.parentId) === areaId).length;
        }
        return {
            id: areaId,
            title: area.title || "(untitled)",
            widgetCount,
        };
    });
    // Tags are not separate widgets in the spec but we surface them from board metadata
    const tags = [];
    return { areas, widgetCounts, tags, totalWidgets };
}
//# sourceMappingURL=summary.js.map