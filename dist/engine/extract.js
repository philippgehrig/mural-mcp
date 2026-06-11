import { apiTypeToSpecKey, SERVER_ONLY_FIELDS } from "../api/types.js";
function stripServerFields(widget) {
    const result = {};
    for (const [key, value] of Object.entries(widget)) {
        if (!SERVER_ONLY_FIELDS.has(key)) {
            result[key] = value;
        }
    }
    return result;
}
function emptySpec() {
    return {
        areas: [],
        sticky_notes: [],
        textboxes: [],
        titles: [],
        shapes: [],
        arrows: [],
    };
}
export async function extractBoard(client, muralId) {
    const rawWidgets = await client.getWidgets(muralId);
    const spec = emptySpec();
    for (const widget of rawWidgets) {
        const apiType = widget.type;
        let specKey;
        try {
            specKey = apiTypeToSpecKey(apiType);
        }
        catch {
            continue; // skip unknown widget types
        }
        spec[specKey].push(stripServerFields(widget));
    }
    return spec;
}
export { stripServerFields, emptySpec };
//# sourceMappingURL=extract.js.map