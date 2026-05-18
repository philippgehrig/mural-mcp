import { describe, it, expect } from "vitest";
import { normalizeHtmlText, normalizeWidgetHtml } from "../../src/engine/html.js";

describe("normalizeHtmlText", () => {
  it("converts bold title with br", () => {
    expect(normalizeHtmlText("<b>Title</b><br />Line 2")).toBe(
      '<html v="1"><div><b><span>Title</span></b></div><div><span>Line 2</span></div></html>',
    );
  });

  it("handles blank lines (double br)", () => {
    expect(normalizeHtmlText("<b>Title</b><br /><br />After blank")).toBe(
      '<html v="1"><div><b><span>Title</span></b></div><div><br /></div><div><span>After blank</span></div></html>',
    );
  });

  it("passes through plain text without breaks", () => {
    expect(normalizeHtmlText("No breaks here")).toBe("No breaks here");
  });

  it("passes through already-native format", () => {
    const native = '<html v="1"><div><span>already native</span></div></html>';
    expect(normalizeHtmlText(native)).toBe(native);
  });

  it("passes through empty string", () => {
    expect(normalizeHtmlText("")).toBe("");
  });

  it("handles <br> without slash", () => {
    expect(normalizeHtmlText("a<br>b")).toBe(
      '<html v="1"><div><span>a</span></div><div><span>b</span></div></html>',
    );
  });
});

describe("normalizeWidgetHtml", () => {
  it("normalizes widget with htmlText", () => {
    const widget = { htmlText: "Hello<br />World", x: 10 };
    const result = normalizeWidgetHtml(widget);
    expect(result.htmlText).toBe(
      '<html v="1"><div><span>Hello</span></div><div><span>World</span></div></html>',
    );
    expect(result.x).toBe(10);
  });

  it("returns same widget if no htmlText", () => {
    const widget = { text: "plain", x: 10 };
    const result = normalizeWidgetHtml(widget);
    expect(result).toBe(widget);
  });

  it("returns same widget if htmlText is already native", () => {
    const widget = { htmlText: '<html v="1"><div><span>ok</span></div></html>' };
    const result = normalizeWidgetHtml(widget);
    expect(result).toBe(widget);
  });
});
