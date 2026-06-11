// The Mural API uses three naming conventions for widget types.
// This tuple is the single source of truth.
const TYPE_MAP = [
    // [apiType, endpoint, specKey, batched?]
    ["area", "area", "areas", false],
    ["sticky note", "sticky-note", "sticky_notes", true],
    ["text", "textbox", "textboxes", true],
    ["title", "title", "titles", true],
    ["shape", "shape", "shapes", true],
    ["arrow", "arrow", "arrows", false],
];
const byApiType = new Map(TYPE_MAP.map(([apiType, endpoint, specKey, batched]) => [
    apiType,
    { endpoint, specKey, batched },
]));
const bySpecKey = new Map(TYPE_MAP.map(([apiType, endpoint, specKey, batched]) => [
    specKey,
    { apiType, endpoint, batched },
]));
export const SPEC_KEYS = TYPE_MAP.map(([, , sk]) => sk);
export function apiTypeToSpecKey(apiType) {
    const entry = byApiType.get(apiType);
    if (!entry)
        throw new Error(`Unknown API type: "${apiType}"`);
    return entry.specKey;
}
export function specKeyToEndpoint(specKey) {
    const entry = bySpecKey.get(specKey);
    if (!entry)
        throw new Error(`Unknown spec key: "${specKey}"`);
    return entry.endpoint;
}
export function specKeyIsBatched(specKey) {
    const entry = bySpecKey.get(specKey);
    if (!entry)
        throw new Error(`Unknown spec key: "${specKey}"`);
    return entry.batched;
}
export function extractMuralId(url) {
    // Mural URLs: https://app.mural.co/t/<workspace>/m/<workspace>/<id>/...
    const match = url.match(/app\.mural\.co\/t\/[^/]+\/m\/[^/]+\/([^/]+)/);
    if (match)
        return match[1];
    // Fallback: treat the whole string as an ID if no URL pattern matches
    if (!url.includes("/"))
        return url;
    throw new Error(`Cannot extract mural ID from URL: "${url}"`);
}
export const SERVER_ONLY_FIELDS = new Set([
    "contentEditedBy",
    "contentEditedOn",
    "createdBy",
    "createdOn",
    "updatedBy",
    "updatedOn",
    "hideEditor",
    "hideOwner",
    "invisible",
    "locked",
    "lockedByFacilitator",
    "stackingOrder",
    "minLines",
    "type",
]);
//# sourceMappingURL=types.js.map