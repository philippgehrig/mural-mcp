export const DEFAULT_WIDTH = 200;
export const DEFAULT_HEIGHT = 200;
export const PADDING = 20;
export const AREA_TITLE_HEIGHT = 100;
export class Rect {
    x;
    y;
    width;
    height;
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    get right() { return this.x + this.width; }
    get bottom() { return this.y + this.height; }
    overlaps(other) {
        return (this.x < other.right &&
            this.right > other.x &&
            this.y < other.bottom &&
            this.bottom > other.y);
    }
}
export function findFreePosition(existing, newWidth, newHeight, areaWidth, areaHeight) {
    const rects = existing.map((w) => new Rect(Number(w.x || 0), Number(w.y || 0), Number(w.width || DEFAULT_WIDTH), Number(w.height || DEFAULT_HEIGHT)));
    const startY = AREA_TITLE_HEIGHT + PADDING;
    const maxX = areaWidth - newWidth - PADDING;
    const maxY = areaHeight - newHeight - PADDING;
    for (let y = startY; y <= maxY; y += newHeight + PADDING) {
        for (let x = PADDING; x <= maxX; x += newWidth + PADDING) {
            const candidate = new Rect(x, y, newWidth, newHeight);
            const collision = rects.some((r) => r.overlaps(candidate));
            if (!collision)
                return { x, y };
        }
    }
    throw new Error(`No free position found in area (${areaWidth}x${areaHeight}) ` +
        `for widget (${newWidth}x${newHeight}) with ${existing.length} existing widgets`);
}
export function autoPlaceWidgets(widgets, existingInArea, areaWidth, areaHeight) {
    const placed = [];
    const errors = [];
    const allExisting = [...existingInArea];
    for (const widget of widgets) {
        const w = Number(widget.width || DEFAULT_WIDTH);
        const h = Number(widget.height || DEFAULT_HEIGHT);
        try {
            const pos = findFreePosition(allExisting, w, h, areaWidth, areaHeight);
            const placedWidget = { ...widget, x: pos.x, y: pos.y };
            placed.push(placedWidget);
            allExisting.push(placedWidget);
        }
        catch (err) {
            errors.push(err.message);
        }
    }
    return { placed, errors };
}
//# sourceMappingURL=placement.js.map