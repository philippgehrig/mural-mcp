import type { BoardSpec } from "../api/types.js";
export interface BoardSummary {
    areas: {
        id: string;
        title: string;
        widgetCount: number;
    }[];
    widgetCounts: Record<string, number>;
    tags: {
        id: string;
        text: string;
        color?: string;
    }[];
    totalWidgets: number;
}
export declare function summarizeBoard(spec: BoardSpec): BoardSummary;
//# sourceMappingURL=summary.d.ts.map