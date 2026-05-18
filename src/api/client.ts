import { getAccessToken, clearCachedToken } from "./auth.js";
import {
  type SpecKey,
  type Widget,
  specKeyToEndpoint,
  specKeyIsBatched,
} from "./types.js";

const API_BASE = "https://app.mural.co/api/public/v1";
const RETRYABLE_CODES = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const RETRY_BACKOFF = [1000, 2000, 4000];
const REQUEST_TIMEOUT = 30_000;

function unwrapList(data: Record<string, unknown>): unknown[] {
  if (Array.isArray(data.value)) return data.value;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function unwrapItem(data: Record<string, unknown>): Record<string, unknown> {
  if (data.value && typeof data.value === "object" && !Array.isArray(data.value)) {
    return data.value as Record<string, unknown>;
  }
  return data;
}

export class MuralClient {
  private token: string | null = null;

  private async ensureToken(): Promise<string> {
    if (!this.token) {
      this.token = await getAccessToken();
    }
    return this.token;
  }

  async request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<unknown> {
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

        if (resp.status === 204) return null;
        return await resp.json();
      } catch (err: unknown) {
        clearTimeout(timeout);
        if (err instanceof Error && err.name === "AbortError") {
          throw new Error(`Request timed out: ${method} ${path}`);
        }
        throw err;
      }
    }

    throw new Error(`Max retries exceeded: ${method} ${path}`);
  }

  async getWidgets(muralId: string): Promise<Widget[]> {
    const encodedId = encodeURIComponent(muralId);
    let allWidgets: Widget[] = [];
    let nextUrl: string | null = `/murals/${encodedId}/widgets`;

    while (nextUrl) {
      const resp = (await this.request("GET", nextUrl)) as Record<string, unknown>;
      const widgets = unwrapList(resp) as Widget[];
      allWidgets = allWidgets.concat(widgets);
      nextUrl = (resp.next as string) || null;
    }

    return allWidgets;
  }

  async createWidgetsByType(
    muralId: string,
    specKey: SpecKey,
    widgets: Widget[],
  ): Promise<Widget[]> {
    if (widgets.length === 0) return [];
    const encodedId = encodeURIComponent(muralId);
    const endpoint = specKeyToEndpoint(specKey);
    const batched = specKeyIsBatched(specKey);

    if (batched) {
      const results: Widget[] = [];
      for (let i = 0; i < widgets.length; i += 1000) {
        const batch = widgets.slice(i, i + 1000);
        const resp = (await this.request(
          "POST",
          `/murals/${encodedId}/widgets/${endpoint}`,
          batch,
        )) as Record<string, unknown>;
        const created = unwrapList(resp) as Widget[];
        results.push(...created);
      }
      return results;
    }

    // Non-batched: create one at a time
    const results: Widget[] = [];
    for (const widget of widgets) {
      const resp = (await this.request(
        "POST",
        `/murals/${encodedId}/widgets/${endpoint}`,
        widget,
      )) as Record<string, unknown>;
      results.push(unwrapItem(resp) as Widget);
    }
    return results;
  }

  async updateWidget(
    muralId: string,
    widgetId: string,
    specKey: SpecKey,
    fields: Partial<Widget>,
  ): Promise<Widget> {
    const encodedMuralId = encodeURIComponent(muralId);
    const encodedWidgetId = encodeURIComponent(widgetId);
    const endpoint = specKeyToEndpoint(specKey);
    const resp = (await this.request(
      "PATCH",
      `/murals/${encodedMuralId}/widgets/${endpoint}/${encodedWidgetId}`,
      fields,
    )) as Record<string, unknown>;
    return unwrapItem(resp) as Widget;
  }

  async deleteWidget(muralId: string, widgetId: string): Promise<void> {
    const encodedMuralId = encodeURIComponent(muralId);
    const encodedWidgetId = encodeURIComponent(widgetId);
    await this.request(
      "DELETE",
      `/murals/${encodedMuralId}/widgets/${encodedWidgetId}`,
    );
  }

  async createBoard(
    roomId: string,
    title: string,
  ): Promise<{ id: string; url: string }> {
    const resp = (await this.request("POST", "/murals", {
      roomId,
      title,
    })) as Record<string, unknown>;
    const board = unwrapItem(resp);
    return {
      id: board.id as string,
      url: board.visitorsSettings
        ? `https://app.mural.co/t/-/m/-/${board.id}`
        : `https://app.mural.co/t/-/m/-/${board.id}`,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
