export interface Widget {
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  parentId?: number | string;
  htmlText?: string;
  text?: string;
  title?: string;
  shape?: string;
  style?: Record<string, unknown>;
  [key: string]: unknown;
}

export type SpecKey =
  | "areas"
  | "sticky_notes"
  | "textboxes"
  | "titles"
  | "shapes"
  | "arrows";

export interface BoardSpec {
  areas: Widget[];
  sticky_notes: Widget[];
  textboxes: Widget[];
  titles: Widget[];
  shapes: Widget[];
  arrows: Widget[];
}

export interface BoardDiff {
  creates: { specKey: SpecKey; widgets: Widget[] }[];
  updates: { specKey: SpecKey; widgetId: string; fields: Partial<Widget> }[];
  deletes: string[];
}

export interface SyncReport {
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
}

export interface ExplicitOps {
  create?: Partial<Record<SpecKey, Widget[]>>;
  update?: Partial<Record<SpecKey, Widget[]>>;
  delete?: string[];
}

// The Mural API uses three naming conventions for widget types.
// This tuple is the single source of truth.
const TYPE_MAP: readonly [string, string, SpecKey, boolean][] = [
  // [apiType, endpoint, specKey, batched?]
  ["area", "area", "areas", false],
  ["sticky note", "sticky-note", "sticky_notes", true],
  ["text", "textbox", "textboxes", true],
  ["title", "title", "titles", true],
  ["shape", "shape", "shapes", true],
  ["arrow", "arrow", "arrows", false],
] as const;

const byApiType = new Map(
  TYPE_MAP.map(([apiType, endpoint, specKey, batched]) => [
    apiType,
    { endpoint, specKey, batched },
  ]),
);

const bySpecKey = new Map(
  TYPE_MAP.map(([apiType, endpoint, specKey, batched]) => [
    specKey,
    { apiType, endpoint, batched },
  ]),
);

export const SPEC_KEYS: SpecKey[] = TYPE_MAP.map(([, , sk]) => sk);

export function apiTypeToSpecKey(apiType: string): SpecKey {
  const entry = byApiType.get(apiType);
  if (!entry) throw new Error(`Unknown API type: "${apiType}"`);
  return entry.specKey;
}

export function specKeyToEndpoint(specKey: SpecKey): string {
  const entry = bySpecKey.get(specKey);
  if (!entry) throw new Error(`Unknown spec key: "${specKey}"`);
  return entry.endpoint;
}

export function specKeyIsBatched(specKey: SpecKey): boolean {
  const entry = bySpecKey.get(specKey);
  if (!entry) throw new Error(`Unknown spec key: "${specKey}"`);
  return entry.batched;
}

export function extractMuralId(url: string): string {
  // Mural URLs: https://app.mural.co/t/<workspace>/m/<workspace>/<id>/...
  const match = url.match(
    /app\.mural\.co\/t\/[^/]+\/m\/[^/]+\/([^/]+)/,
  );
  if (match) return match[1];
  // Fallback: treat the whole string as an ID if no URL pattern matches
  if (!url.includes("/")) return url;
  throw new Error(`Cannot extract mural ID from URL: "${url}"`);
}

export const SERVER_ONLY_FIELDS: ReadonlySet<string> = new Set([
  "contentEditedBy",
  "contentEditedOn",
  "createdBy",
  "createdOn",
  "updatedBy",
  "updatedOn",
  "hideEditor",
  "hideOwner",
  "invisible",
  "locked",
  "lockedByFacilitator",
  "stackingOrder",
  "minLines",
  "type",
]);
