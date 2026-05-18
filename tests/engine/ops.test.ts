import { describe, it, expect } from "vitest";
import { parseExplicitOps } from "../../src/engine/ops.js";

describe("parseExplicitOps", () => {
  it("parses valid create", () => {
    const result = parseExplicitOps({
      create: {
        sticky_notes: [{ x: 10, y: 10, htmlText: "hello" }],
      },
    });
    expect(result.creates).toHaveLength(1);
    expect(result.creates[0].specKey).toBe("sticky_notes");
    expect(result.creates[0].widgets).toHaveLength(1);
  });

  it("parses valid update", () => {
    const result = parseExplicitOps({
      update: {
        sticky_notes: [{ id: "abc", htmlText: "updated" }],
      },
    });
    expect(result.updates).toHaveLength(1);
    expect(result.updates[0].widgetId).toBe("abc");
    expect(result.updates[0].fields).toEqual({ htmlText: "updated" });
  });

  it("parses valid delete", () => {
    const result = parseExplicitOps({
      delete: ["id-1", "id-2"],
    });
    expect(result.deletes).toEqual(["id-1", "id-2"]);
  });

  it("rejects create with id", () => {
    expect(() =>
      parseExplicitOps({
        create: { sticky_notes: [{ id: "bad", x: 10 }] },
      }),
    ).toThrow("must not have an id");
  });

  it("rejects update without id", () => {
    expect(() =>
      parseExplicitOps({
        update: { sticky_notes: [{ htmlText: "no id" }] },
      }),
    ).toThrow("must have an id");
  });

  it("rejects update with only id", () => {
    expect(() =>
      parseExplicitOps({
        update: { sticky_notes: [{ id: "abc" }] },
      }),
    ).toThrow("at least one field");
  });

  it("rejects invalid spec key", () => {
    expect(() =>
      parseExplicitOps({
        create: { invalid_type: [{ x: 10 }] } as any,
      }),
    ).toThrow("Invalid spec key");
  });
});
