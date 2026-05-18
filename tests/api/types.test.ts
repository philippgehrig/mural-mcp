import { describe, it, expect } from "vitest";
import {
  apiTypeToSpecKey,
  specKeyToEndpoint,
  specKeyIsBatched,
  extractMuralId,
  SPEC_KEYS,
  SERVER_ONLY_FIELDS,
} from "../../src/api/types.js";

describe("apiTypeToSpecKey", () => {
  it("maps sticky note", () => {
    expect(apiTypeToSpecKey("sticky note")).toBe("sticky_notes");
  });

  it("maps text to textboxes", () => {
    expect(apiTypeToSpecKey("text")).toBe("textboxes");
  });

  it("maps area", () => {
    expect(apiTypeToSpecKey("area")).toBe("areas");
  });

  it("throws on unknown type", () => {
    expect(() => apiTypeToSpecKey("unknown")).toThrow("Unknown API type");
  });
});

describe("specKeyToEndpoint", () => {
  it("maps sticky_notes to sticky-note", () => {
    expect(specKeyToEndpoint("sticky_notes")).toBe("sticky-note");
  });

  it("maps textboxes to textbox", () => {
    expect(specKeyToEndpoint("textboxes")).toBe("textbox");
  });

  it("throws on unknown key", () => {
    expect(() => specKeyToEndpoint("unknown" as any)).toThrow(
      "Unknown spec key",
    );
  });
});

describe("specKeyIsBatched", () => {
  it("areas are not batched", () => {
    expect(specKeyIsBatched("areas")).toBe(false);
  });

  it("sticky_notes are batched", () => {
    expect(specKeyIsBatched("sticky_notes")).toBe(true);
  });

  it("arrows are not batched", () => {
    expect(specKeyIsBatched("arrows")).toBe(false);
  });
});

describe("extractMuralId", () => {
  it("extracts from full URL", () => {
    const url =
      "https://app.mural.co/t/myworkspace/m/myworkspace/1716000000000/abc123";
    expect(extractMuralId(url)).toBe("1716000000000");
  });

  it("handles URL with trailing path", () => {
    const url =
      "https://app.mural.co/t/ws/m/ws/board-id-123/some-slug?foo=bar";
    expect(extractMuralId(url)).toBe("board-id-123");
  });

  it("returns raw string if no slashes (plain ID)", () => {
    expect(extractMuralId("my-board-id")).toBe("my-board-id");
  });

  it("throws on unrecognized URL", () => {
    expect(() => extractMuralId("https://example.com/foo/bar")).toThrow(
      "Cannot extract mural ID",
    );
  });
});

describe("SPEC_KEYS", () => {
  it("contains all 6 spec keys", () => {
    expect(SPEC_KEYS).toHaveLength(6);
    expect(SPEC_KEYS).toContain("areas");
    expect(SPEC_KEYS).toContain("sticky_notes");
    expect(SPEC_KEYS).toContain("arrows");
  });
});

describe("SERVER_ONLY_FIELDS", () => {
  it("contains expected fields", () => {
    expect(SERVER_ONLY_FIELDS.has("createdBy")).toBe(true);
    expect(SERVER_ONLY_FIELDS.has("stackingOrder")).toBe(true);
    expect(SERVER_ONLY_FIELDS.has("type")).toBe(true);
  });

  it("does not contain user fields", () => {
    expect(SERVER_ONLY_FIELDS.has("htmlText")).toBe(false);
    expect(SERVER_ONLY_FIELDS.has("style")).toBe(false);
  });
});
