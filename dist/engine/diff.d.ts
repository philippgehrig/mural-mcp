import type { Widget, BoardSpec, BoardDiff } from "../api/types.js";
declare function stripMetadata(widget: Widget): Widget;
declare function changedFields(desired: Widget, server: Widget): Partial<Widget>;
declare function posMatch(a: Widget, b: Widget, tolerance: number): boolean;
export declare function computeDiff(serverWidgets: BoardSpec, desiredWidgets: BoardSpec, options?: {
    tolerance?: number;
}): BoardDiff;
export { stripMetadata, changedFields, posMatch };
//# sourceMappingURL=diff.d.ts.map