export interface Widget {
    id?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    parentId?: number | string;
    htmlText?: string;
    text?: string;
    title?: string;
    shape?: string;
    style?: Record<string, unknown>;
    [key: string]: unknown;
}
export type SpecKey = "areas" | "sticky_notes" | "textboxes" | "titles" | "shapes" | "arrows";
export interface BoardSpec {
    areas: Widget[];
    sticky_notes: Widget[];
    textboxes: Widget[];
    titles: Widget[];
    shapes: Widget[];
    arrows: Widget[];
}
export interface BoardDiff {
    creates: {
        specKey: SpecKey;
        widgets: Widget[];
    }[];
    updates: {
        specKey: SpecKey;
        widgetId: string;
        fields: Partial<Widget>;
    }[];
    deletes: string[];
}
export interface SyncReport {
    created: number;
    updated: number;
    deleted: number;
    errors: string[];
}
export interface ExplicitOps {
    create?: Partial<Record<SpecKey, Widget[]>>;
    update?: Partial<Record<SpecKey, Widget[]>>;
    delete?: string[];
}
export declare const SPEC_KEYS: SpecKey[];
export declare function apiTypeToSpecKey(apiType: string): SpecKey;
export declare function specKeyToEndpoint(specKey: SpecKey): string;
export declare function specKeyIsBatched(specKey: SpecKey): boolean;
export declare function extractMuralId(url: string): string;
export declare const SERVER_ONLY_FIELDS: ReadonlySet<string>;
//# sourceMappingURL=types.d.ts.map