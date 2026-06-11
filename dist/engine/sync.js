import { normalizeWidgetHtml } from "./html.js";
export async function applyDiff(client, muralId, diff, options = {}) {
    const report = { created: 0, updated: 0, deleted: 0, errors: [] };
    if (options.dryRun) {
        for (const group of diff.creates) {
            report.created += group.widgets.length;
        }
        report.updated = diff.updates.length;
        report.deleted = diff.deletes.length;
        return report;
    }
    // Step 1: Deletes
    for (const widgetId of diff.deletes) {
        try {
            await client.deleteWidget(muralId, widgetId);
            report.deleted++;
        }
        catch (err) {
            report.errors.push(`Delete ${widgetId}: ${err.message}`);
        }
    }
    // Step 2: Creates — areas first (need their IDs for parentId resolution)
    const areaIdMap = new Map(); // index → server ID
    const areaCreates = diff.creates.filter((g) => g.specKey === "areas");
    const otherCreates = diff.creates.filter((g) => g.specKey !== "areas");
    for (const group of areaCreates) {
        try {
            const normalized = group.widgets.map(normalizeWidgetHtml);
            const created = await client.createWidgetsByType(muralId, "areas", normalized);
            for (let i = 0; i < created.length; i++) {
                areaIdMap.set(i, created[i].id);
            }
            report.created += created.length;
        }
        catch (err) {
            report.errors.push(`Create areas: ${err.message}`);
        }
    }
    // Step 3: Create other widgets, resolving integer parentId to real UUIDs
    for (const group of otherCreates) {
        try {
            const resolved = group.widgets.map((w) => {
                const widget = normalizeWidgetHtml(w);
                if (typeof widget.parentId === "number") {
                    const realId = areaIdMap.get(widget.parentId);
                    if (realId) {
                        return { ...widget, parentId: realId };
                    }
                }
                return widget;
            });
            const created = await client.createWidgetsByType(muralId, group.specKey, resolved);
            report.created += created.length;
        }
        catch (err) {
            report.errors.push(`Create ${group.specKey}: ${err.message}`);
        }
    }
    // Step 4: Updates
    for (const update of diff.updates) {
        try {
            const fields = normalizeWidgetHtml(update.fields);
            await client.updateWidget(muralId, update.widgetId, update.specKey, fields);
            report.updated++;
        }
        catch (err) {
            report.errors.push(`Update ${update.widgetId}: ${err.message}`);
        }
    }
    return report;
}
//# sourceMappingURL=sync.js.map