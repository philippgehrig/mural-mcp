import type { Widget } from "../api/types.js";

const BR_PATTERN = /<br\s*\/?>/gi;

export function normalizeHtmlText(html: string): string {
  if (!html || html.startsWith("<html v=")) return html;
  if (!BR_PATTERN.test(html)) return html;
  // Reset lastIndex since we used the 'g' flag for test()
  BR_PATTERN.lastIndex = 0;

  const parts = html.split(BR_PATTERN);
  const divs: string[] = [];

  for (const raw of parts) {
    const part = raw.trim();
    if (!part) {
      divs.push("<div><br /></div>");
      continue;
    }
    const boldMatch = part.match(/^<b>(.*)<\/b>$/is);
    if (boldMatch) {
      divs.push(`<div><b><span>${boldMatch[1]}</span></b></div>`);
    } else {
      divs.push(`<div><span>${part}</span></div>`);
    }
  }

  return `<html v="1">${divs.join("")}</html>`;
}

export function normalizeWidgetHtml(widget: Widget): Widget {
  const html = widget.htmlText;
  if (html === undefined || html === null) return widget;
  const normalized = normalizeHtmlText(html as string);
  if (normalized === html) return widget;
  return { ...widget, htmlText: normalized };
}
