import { SPEC_KEYS, SERVER_ONLY_FIELDS } from "../api/types.js";
function stripMetadata(widget) {
    const result = {};
    for (const [key, value] of Object.entries(widget)) {
        if (!SERVER_ONLY_FIELDS.has(key)) {
            result[key] = value;
        }
    }
    return result;
}
function changedFields(desired, server) {
    const sd = stripMetadata(desired);
    const ss = stripMetadata(server);
    const diff = {};
    for (const [key, value] of Object.entries(sd)) {
        if (key === "id")
            continue;
        // Integer parentId = unresolved placeholder (area index)
        if (key === "parentId" && typeof value === "number")
            continue;
        if (JSON.stringify(ss[key]) !== JSON.stringify(value)) {
            diff[key] = value;
        }
    }
    return diff;
}
function posMatch(a, b, tolerance) {
    const ax = a.x, ay = a.y, bx = b.x, by = b.y;
    if (ax == null || ay == null || bx == null || by == null)
        return false;
    return (Math.abs(Number(ax) - Number(bx)) <= tolerance &&
        Math.abs(Number(ay) - Number(by)) <= tolerance);
}
export function computeDiff(serverWidgets, desiredWidgets, options = {}) {
    const tolerance = options.tolerance ?? 5.0;
    const diff = { creates: [], updates: [], deletes: [] };
    let unchanged = 0;
    for (const specKey of SPEC_KEYS) {
        const serverList = serverWidgets[specKey] || [];
        const desiredList = desiredWidgets[specKey] || [];
        const serverById = new Map();
        const serverUnmatched = [];
        for (const sw of serverList) {
            const sid = sw.id;
            if (sid) {
                serverById.set(sid, sw);
            }
            else {
                serverUnmatched.push(sw);
            }
        }
        const matchedServerIds = new Set();
        const toCreate = [];
        for (const dw of desiredList) {
            const did = dw.id;
            if (did) {
                const sw = serverById.get(did);
                if (!sw) {
                    throw new Error(`Stale widget ID "${did}" in ${specKey}: not found on server. ` +
                        "Remove the id field to create a new widget, or re-extract the board.");
                }
                matchedServerIds.add(did);
                const changed = changedFields(dw, sw);
                if (Object.keys(changed).length > 0) {
                    diff.updates.push({ specKey, widgetId: did, fields: changed });
                }
                else {
                    unchanged++;
                }
            }
            else {
                // Position-based match
                let match = null;
                let matchIdx = -1;
                for (let i = 0; i < serverUnmatched.length; i++) {
                    if (posMatch(dw, serverUnmatched[i], tolerance)) {
                        match = serverUnmatched[i];
                        matchIdx = i;
                        break;
                    }
                }
                if (!match) {
                    for (const [sid, sw] of serverById) {
                        if (!matchedServerIds.has(sid) && posMatch(dw, sw, tolerance)) {
                            match = sw;
                            matchedServerIds.add(sid);
                            break;
                        }
                    }
                }
                if (match) {
                    if (matchIdx >= 0)
                        serverUnmatched.splice(matchIdx, 1);
                    const mid = match.id;
                    if (mid) {
                        const changed = changedFields(dw, match);
                        if (Object.keys(changed).length > 0) {
                            diff.updates.push({ specKey, widgetId: mid, fields: changed });
                        }
                        else {
                            unchanged++;
                        }
                    }
                    else {
                        toCreate.push(stripMetadata(dw));
                    }
                }
                else {
                    toCreate.push(stripMetadata(dw));
                }
            }
        }
        if (toCreate.length > 0) {
            diff.creates.push({ specKey, widgets: toCreate });
        }
        // Unmatched server widgets → delete
        for (const [sid] of serverById) {
            if (!matchedServerIds.has(sid)) {
                diff.deletes.push(sid);
            }
        }
        for (const sw of serverUnmatched) {
            if (sw.id)
                diff.deletes.push(sw.id);
        }
    }
    return diff;
}
export { stripMetadata, changedFields, posMatch };
//# sourceMappingURL=diff.js.map