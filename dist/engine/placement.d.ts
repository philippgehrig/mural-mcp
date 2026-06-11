import type { Widget } from "../api/types.js";
export declare const DEFAULT_WIDTH = 200;
export declare const DEFAULT_HEIGHT = 200;
export declare const PADDING = 20;
export declare const AREA_TITLE_HEIGHT = 100;
export declare class Rect {
    x: number;
    y: number;
    width: number;
    height: number;
    constructor(x: number, y: number, width: number, height: number);
    get right(): number;
    get bottom(): number;
    overlaps(other: Rect): boolean;
}
export declare function findFreePosition(existing: Widget[], newWidth: number, newHeight: number, areaWidth: number, areaHeight: number): {
    x: number;
    y: number;
};
export declare function autoPlaceWidgets(widgets: Widget[], existingInArea: Widget[], areaWidth: number, areaHeight: number): {
    placed: Widget[];
    errors: string[];
};
//# sourceMappingURL=placement.d.ts.map