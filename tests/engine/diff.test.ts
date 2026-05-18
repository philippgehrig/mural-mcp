import { describe, it, expect } from "vitest";
import { computeDiff, posMatch, changedFields } from "../../src/engine/diff.js";
import type { BoardSpec } from "../../src/api/types.js";

function emptySpec(): BoardSpec {
  return { areas: [], sticky_notes: [], textboxes: [], titles: [], shapes: [], arrows: [] };
}

describe("posMatch", () => {
  it("matches within tolerance", () => {
    expect(posMatch({ x: 10, y: 20 }, { x: 13, y: 22 }, 5)).toBe(true);
  });

  it("rejects outside tolerance", () => {
    expect(posMatch({ x: 10, y: 20 }, { x: 20, y: 20 }, 5)).toBe(false);
  });

  it("returns false if coordinates missing", () => {
    expect(posMatch({ x: 10 }, { x: 10, y: 20 }, 5)).toBe(false);
  });
});

describe("changedFields", () => {
  it("detects changed text", () => {
    const result = changedFields(
      { id: "a", htmlText: "new" },
      { id: "a", htmlText: "old" },
    );
    expect(result).toEqual({ htmlText: "new" });
  });

  it("skips id field", () => {
    const result = changedFields({ id: "a", x: 10 }, { id: "a", x: 10 });
    expect(result).toEqual({});
  });

  it("skips integer parentId", () => {
    const result = changedFields(
      { id: "a", parentId: 0, x: 10 },
      { id: "a", x: 10 },
    );
    expect(result).toEqual({});
  });
});

describe("computeDiff", () => {
  it("identical widgets → no changes", () => {
    const server: BoardSpec = {
      ...emptySpec(),
      sticky_notes: [{ id: "s1", x: 10, y: 10, htmlText: "Hello" }],
    };
    const desired: BoardSpec = {
      ...emptySpec(),
      sticky_notes: [{ id: "s1", x: 10, y: 10, htmlText: "Hello" }],
    };
    const diff = computeDiff(server, desired);
    expect(diff.creates).toHaveLength(0);
    expect(diff.updates).toHaveLength(0);
    expect(diff.deletes).toHaveLength(0);
  });

  it("field diff → update", () => {
    const server: BoardSpec = {
      ...emptySpec(),
      sticky_notes: [{ id: "s1", x: 10, y: 10, htmlText: "Old" }],
    };
    const desired: BoardSpec = {
      ...emptySpec(),
      sticky_notes: [{ id: "s1", x: 10, y: 10, htmlText: "New" }],
    };
    const diff = computeDiff(server, desired);
    expect(diff.updates).toHaveLength(1);
    expect(diff.updates[0].widgetId).toBe("s1");
    expect(diff.updates[0].fields).toEqual({ htmlText: "New" });
  });

  it("no match → create", () => {
    const server = emptySpec();
    const desired: BoardSpec = {
      ...emptySpec(),
      sticky_notes: [{ x: 100, y: 100, htmlText: "New sticky" }],
    };
    const diff = computeDiff(server, desired);
    expect(diff.creates).toHaveLength(1);
    expect(diff.creates[0].specKey).toBe("sticky_notes");
    expect(diff.creates[0].widgets).toHaveLength(1);
  });

  it("unmatched server widgets → delete", () => {
    const server: BoardSpec = {
      ...emptySpec(),
      sticky_notes: [{ id: "s1", x: 10, y: 10, htmlText: "Old" }],
    };
    const desired = emptySpec();
    const diff = computeDiff(server, desired);
    expect(diff.deletes).toContain("s1");
  });

  it("stale ID → throws", () => {
    const server = emptySpec();
    const desired: BoardSpec = {
      ...emptySpec(),
      sticky_notes: [{ id: "nonexistent", x: 10, y: 10 }],
    };
    expect(() => computeDiff(server, desired)).toThrow("Stale widget ID");
  });
});
