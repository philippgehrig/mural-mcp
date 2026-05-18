import { describe, it, expect } from "vitest";
import { Rect, findFreePosition, autoPlaceWidgets, PADDING, AREA_TITLE_HEIGHT } from "../../src/engine/placement.js";

describe("Rect.overlaps", () => {
  it("detects overlap", () => {
    const a = new Rect(0, 0, 100, 100);
    const b = new Rect(50, 50, 100, 100);
    expect(a.overlaps(b)).toBe(true);
  });

  it("detects no overlap", () => {
    const a = new Rect(0, 0, 100, 100);
    const b = new Rect(200, 200, 100, 100);
    expect(a.overlaps(b)).toBe(false);
  });

  it("touching edges do not overlap", () => {
    const a = new Rect(0, 0, 100, 100);
    const b = new Rect(100, 0, 100, 100);
    expect(a.overlaps(b)).toBe(false);
  });
});

describe("findFreePosition", () => {
  it("places in empty area", () => {
    const pos = findFreePosition([], 200, 200, 600, 600);
    expect(pos.x).toBe(PADDING);
    expect(pos.y).toBe(AREA_TITLE_HEIGHT + PADDING);
  });

  it("avoids existing widget", () => {
    const existing = [{ x: PADDING, y: AREA_TITLE_HEIGHT + PADDING, width: 200, height: 200 }];
    const pos = findFreePosition(existing, 200, 200, 800, 800);
    // Should be placed next to the existing widget
    expect(pos.x).toBeGreaterThan(PADDING);
  });

  it("throws when area is full", () => {
    // Fill a tiny area
    const existing = [{ x: PADDING, y: AREA_TITLE_HEIGHT + PADDING, width: 200, height: 200 }];
    expect(() => findFreePosition(existing, 200, 200, 240, 320)).toThrow("No free position");
  });
});

describe("autoPlaceWidgets", () => {
  it("places multiple widgets without collision", () => {
    const widgets = [
      { width: 100, height: 100, htmlText: "a" },
      { width: 100, height: 100, htmlText: "b" },
    ];
    const { placed, errors } = autoPlaceWidgets(widgets, [], 600, 600);
    expect(placed).toHaveLength(2);
    expect(errors).toHaveLength(0);
    // They should not overlap
    const r1 = new Rect(placed[0].x!, placed[0].y!, 100, 100);
    const r2 = new Rect(placed[1].x!, placed[1].y!, 100, 100);
    expect(r1.overlaps(r2)).toBe(false);
  });
});
