import { getAccessToken, clearCachedToken } from "./auth.js";
import { specKeyToEndpoint, specKeyIsBatched, } from "./types.js";
const API_BASE = "https://app.mural.co/api/public/v1";
const RETRYABLE_CODES = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const RETRY_BACKOFF = [1000, 2000, 4000];
const REQUEST_TIMEOUT = 30_000;
function unwrapList(data) {
    if (Array.isArray(data.value))
        return data.value;
    if (Array.isArray(data.data))
        return data.data;
    return [];
}
function unwrapItem(data) {
    if (data.value && typeof data.value === "object" && !Array.isArray(data.value)) {
        return data.value;
    }
    return data;
}
export class MuralClient {
    token = null;
    async ensureToken() {
        if (!this.token) {
            this.token = await getAccessToken();
        }
        return this.token;
    }
    async request(method, path, body) {
        const token = await this.ensureToken();
        const url = `${API_BASE}${path}`;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
            try {
                const resp = await fetch(url, {
                    method,
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: body ? JSON.stringify(body) : undefined,
                    signal: controller.signal,
                });
                clearTimeout(timeout);
                if (resp.status === 401) {
                    clearCachedToken();
                    this.token = null;
                    throw new Error("Authentication expired. Please retry to trigger a fresh OAuth flow.");
                }
                if (RETRYABLE_CODES.has(resp.status) && attempt < MAX_RETRIES) {
                    await sleep(RETRY_BACKOFF[attempt]);
                    continue;
                }
                if (!resp.ok) {
                    const text = await resp.text();
                    throw new Error(`Mural API ${method} ${path} failed (${resp.status}): ${text}`);
                }
                if (resp.status === 204)
                    return null;
                return await resp.json();
            }
            catch (err) {
                clearTimeout(timeout);
                if (err instanceof Error && err.name === "AbortError") {
                    throw new Error(`Request timed out: ${method} ${path}`);
                }
                throw err;
            }
        }
        throw new Error(`Max retries exceeded: ${method} ${path}`);
    }
    async getWidgets(muralId) {
        const encodedId = encodeURIComponent(muralId);
        let allWidgets = [];
        let nextUrl = `/murals/${encodedId}/widgets`;
        while (nextUrl) {
            const resp = (await this.request("GET", nextUrl));
            const widgets = unwrapList(resp);
            allWidgets = allWidgets.concat(widgets);
            nextUrl = resp.next || null;
        }
        return allWidgets;
    }
    async createWidgetsByType(muralId, specKey, widgets) {
        if (widgets.length === 0)
            return [];
        const encodedId = encodeURIComponent(muralId);
        const endpoint = specKeyToEndpoint(specKey);
        const batched = specKeyIsBatched(specKey);
        if (batched) {
            const results = [];
            for (let i = 0; i < widgets.length; i += 1000) {
                const batch = widgets.slice(i, i + 1000);
                const resp = (await this.request("POST", `/murals/${encodedId}/widgets/${endpoint}`, batch));
                const created = unwrapList(resp);
                results.push(...created);
            }
            return results;
        }
        // Non-batched: create one at a time
        const results = [];
        for (const widget of widgets) {
            const resp = (await this.request("POST", `/murals/${encodedId}/widgets/${endpoint}`, widget));
            results.push(unwrapItem(resp));
        }
        return results;
    }
    async updateWidget(muralId, widgetId, specKey, fields) {
        const encodedMuralId = encodeURIComponent(muralId);
        const encodedWidgetId = encodeURIComponent(widgetId);
        const endpoint = specKeyToEndpoint(specKey);
        const resp = (await this.request("PATCH", `/murals/${encodedMuralId}/widgets/${endpoint}/${encodedWidgetId}`, fields));
        return unwrapItem(resp);
    }
    async deleteWidget(muralId, widgetId) {
        const encodedMuralId = encodeURIComponent(muralId);
        const encodedWidgetId = encodeURIComponent(widgetId);
        await this.request("DELETE", `/murals/${encodedMuralId}/widgets/${encodedWidgetId}`);
    }
    async createBoard(roomId, title) {
        const resp = (await this.request("POST", "/murals", {
            roomId,
            title,
        }));
        const board = unwrapItem(resp);
        const boardId = board.id;
        const [workspace, numericId] = boardId.split(".");
        return {
            id: boardId,
            url: `https://app.mural.co/t/${workspace}/m/${workspace}/${numericId}`,
        };
    }
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=client.js.map