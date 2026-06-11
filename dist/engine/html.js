const BR_PATTERN = /<br\s*\/?>/gi;
export function normalizeHtmlText(html) {
    if (!html || html.startsWith("<html v="))
        return html;
    if (!BR_PATTERN.test(html))
        return html;
    // Reset lastIndex since we used the 'g' flag for test()
    BR_PATTERN.lastIndex = 0;
    const parts = html.split(BR_PATTERN);
    const divs = [];
    for (const raw of parts) {
        const part = raw.trim();
        if (!part) {
            divs.push("<div><br /></div>");
            continue;
        }
        const boldMatch = part.match(/^<b>(.*)<\/b>$/is);
        if (boldMatch) {
            divs.push(`<div><b><span>${boldMatch[1]}</span></b></div>`);
        }
        else {
            divs.push(`<div><span>${part}</span></div>`);
        }
    }
    return `<html v="1">${divs.join("")}</html>`;
}
export function normalizeWidgetHtml(widget) {
    const html = widget.htmlText;
    if (html === undefined || html === null)
        return widget;
    const normalized = normalizeHtmlText(html);
    if (normalized === html)
        return widget;
    return { ...widget, htmlText: normalized };
}
//# sourceMappingURL=html.js.map