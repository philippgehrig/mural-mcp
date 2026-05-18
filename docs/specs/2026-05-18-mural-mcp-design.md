# Mural MCP Plugin — Design Spec

## Overview

A standalone Claude Code plugin that provides full Mural board management via MCP tools. TypeScript implementation, installable via `/plugin add <git-url>`. Ports all functionality from the [kastl](https://git.swf.i.mercedes-benz.com/oak/ci-cd/sandbox/maxflis/kastl) Python/Nushell mural tooling to a self-contained Node.js MCP server.

## Goals

- Full feature parity with kastl's Mural tools (extract, summary, query, update, create)
- Full API compatibility (batching, type normalization, HTML auto-normalization, collision avoidance)
- Self-contained OAuth2 flow (browser-based, no external CLI dependencies)
- Claude Code plugin format (`.claude-plugin/`, `.mcp.json`, `userConfig`)
- Cross-platform (macOS, Linux, Windows via WSL)

## Architecture

Three-layer architecture separating concerns:

```
src/
  api/              — Mural REST API layer
    auth.ts         — OAuth2 Authorization Code flow + token storage/refresh
    client.ts       — HTTP client, auth injection, retry logic, rate limiting
    types.ts        — API request/response types, type maps
  engine/           — Business logic layer
    extract.ts      — Board extraction, spec grouping
    summary.ts      — Compact board overview (counts, areas, tags)
    query.ts        — Widget filtering (by area, type, text content)
    diff.ts         — Diff engine: compute_diff(server, desired) → operations
    ops.ts          — Explicit-ops parser: parse create/update/delete input
    sync.ts         — Apply operations to API (batching, ordering)
    placement.ts    — Collision avoidance: find free positions inside areas
    html.ts         — HTML normalization (<br/> → Mural native <html v="1"> format)
    templates.ts    — Board templates (retro, kanban, brainstorm, sprint_planning, swot)
    palettes.ts     — Named color palettes and semantic color maps
  tools/            — MCP tool definitions (thin wrappers)
    extract.ts      — mural_extract_board
    summary.ts      — mural_summary
    query.ts        — mural_query_widgets
    update.ts       — mural_update_board
    create.ts       — mural_create_board
  index.ts          — MCP server entry point, tool registration
```

## Plugin Configuration

### `.claude-plugin/plugin.json`

```json
{
  "name": "mural",
  "version": "0.1.0",
  "description": "Mural board management for Claude Code. Extract, update, create, and query Mural boards.",
  "author": {
    "name": "Philipp Gehrig"
  },
  "repository": "https://git.swf.i.mercedes-benz.com/pgehrig/mural-mcp",
  "license": "MIT",
  "keywords": ["mural", "whiteboard", "mcp", "collaboration"],
  "userConfig": {
    "mural_client_id": {
      "type": "string",
      "title": "Mural OAuth Client ID",
      "description": "OAuth app client ID from https://app.mural.co/me/apps",
      "required": true
    },
    "mural_client_secret": {
      "type": "string",
      "title": "Mural OAuth Client Secret",
      "description": "OAuth app client secret",
      "sensitive": true,
      "required": true
    },
    "mural_workspace": {
      "type": "string",
      "title": "Default workspace",
      "description": "Default Mural workspace ID (optional, auto-detected from URLs)"
    }
  }
}
```

### `.mcp.json`

```json
{
  "mcpServers": {
    "mural": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/dist/index.js"],
      "env": {
        "MURAL_CLIENT_ID": "${user_config.mural_client_id}",
        "MURAL_CLIENT_SECRET": "${user_config.mural_client_secret}",
        "MURAL_WORKSPACE": "${user_config.mural_workspace}"
      }
    }
  }
}
```

## Layer Details

### API Layer (`src/api/`)

#### `auth.ts` — OAuth2 Flow

Implements the OAuth 2.0 Authorization Code flow:

1. Start a local HTTP server on port 9876 (configurable via `MURAL_CALLBACK_PORT`)
2. Open browser to Mural authorization URL with CSRF state token
3. Capture callback with auth code
4. Exchange code for access token
5. Persist token + expiry to a file (`~/.mural-mcp/token.json`)
6. On subsequent calls, check expiry (with 60s margin) and reuse cached token

Token storage path: `~/.mural-mcp/token.json` (JSON with `access_token`, `expires_at`).

The auth function is called lazily on first API request. If the token is expired, it triggers the browser flow again.

Differences from kastl:
- No macOS Keychain dependency — uses file-based token storage
- No Touch ID / local auth gate for writes (not applicable in MCP context)
- No separate `auth/provider.py` — self-contained

#### `client.ts` — HTTP Client

Wraps all Mural REST API calls:

- Automatic `Authorization: Bearer <token>` header injection
- Retry logic for transient errors (429, 500, 502, 503, 504) with exponential backoff (1s, 2s, 4s)
- Max 3 retries per request
- 30-second timeout per request
- JSON serialization/deserialization
- Response unwrapping (`{value: [...]}` or `{data: [...]}` → `[...]`)
- URL percent-encoding for IDs containing dots

Key methods:
- `request(method, path, body?)` — core HTTP method
- `getWidgets(muralId)` — paginated widget fetch
- `createWidgetsByType(muralId, specKey, widgets[])` — auto-routes batched vs individual
- `updateWidget(muralId, specKey, widgetId, fields)` — PATCH single widget
- `deleteWidget(muralId, widgetId)` — DELETE single widget
- `createBoard(roomId, title, options?)` — POST new board

#### `types.ts` — Type System

The Mural API uses three naming conventions for widget types:

| API response `type` | API endpoint | Spec key (our format) | Batched? |
|---|---|---|---|
| `"area"` | `area` | `areas` | No |
| `"sticky note"` | `sticky-note` | `sticky_notes` | Yes (1000) |
| `"text"` | `textbox` | `textboxes` | Yes (1000) |
| `"title"` | `title` | `titles` | Yes (1000) |
| `"shape"` | `shape` | `shapes` | Yes (1000) |
| `"arrow"` | `arrow` | `arrows` | No |

Exports:
- `TYPE_MAP` — the canonical mapping table
- `apiTypeToSpecKey(apiType)` — e.g. `"sticky note"` → `"sticky_notes"`
- `specKeyToEndpoint(specKey)` — e.g. `"sticky_notes"` → `"sticky-note"`
- `specKeyIsBatched(specKey)` — e.g. `"sticky_notes"` → `true`
- `SPEC_KEYS` — `["areas", "sticky_notes", "textboxes", "titles", "shapes", "arrows"]`
- `extractMuralId(url)` — parse board ID from Mural URL

TypeScript interfaces for: `Widget`, `BoardSpec`, `BoardDiff`, `SyncReport`, `DesiredStateSpec`, `ExplicitOpsSpec`.

### Engine Layer (`src/engine/`)

#### `extract.ts` — Board Extraction

Fetches all widgets from a board and groups them into a spec object:

```typescript
interface BoardSpec {
  areas: Widget[];
  sticky_notes: Widget[];
  textboxes: Widget[];
  titles: Widget[];
  shapes: Widget[];
  arrows: Widget[];
}
```

Strips server-only metadata fields from the output:
`contentEditedBy`, `contentEditedOn`, `createdBy`, `createdOn`, `updatedBy`, `updatedOn`, `hideEditor`, `hideOwner`, `invisible`, `locked`, `lockedByFacilitator`, `stackingOrder`, `minLines`

Preserves `id` on each widget so round-trips work (update can match by ID).

#### `summary.ts` — Board Summary

Returns a compact overview suitable for LLM context:

```typescript
interface BoardSummary {
  title: string;
  areas: { id: string; title: string; widgetCount: number }[];
  widgetCounts: Record<string, number>;
  tags: { id: string; text: string; color?: string }[];
  totalWidgets: number;
}
```

#### `query.ts` — Widget Filtering

Filters extracted widgets by:
- `area` — match by area ID or title (widgets with matching `parentId`)
- `type` — filter by spec key (`sticky_notes`, `titles`, etc.)
- `text` — substring match on `htmlText`, `text`, or `title` fields

Returns filtered `BoardSpec` (same structure, fewer widgets).

#### `diff.ts` — Diff Engine

Computes the minimal set of operations to transform current board state into desired state:

Input: `computeDiff(serverWidgets: BoardSpec, desiredSpec: BoardSpec, options: { clear?: boolean })`

Logic:
1. For each widget in desired spec **with `id`**: match to server widget by ID
   - If fields differ → PATCH (only changed fields)
   - If identical → skip
2. For each widget in desired spec **without `id`**: match by position (within 5px tolerance on x,y)
   - Match found and fields differ → PATCH
   - No match → CREATE
3. If `clear` is true: server widgets not in desired spec → DELETE

Output: `BoardDiff` containing `creates`, `updates`, `deletes` arrays.

#### `ops.ts` — Explicit Operations Parser

Parses the explicit-ops input format:

```typescript
interface ExplicitOps {
  create?: Partial<Record<SpecKey, Widget[]>>;
  update?: Partial<Record<SpecKey, Widget[]>>;
  delete?: string[];
}
```

Validation:
- `create` items must NOT have `id`
- `update` items MUST have `id` + at least one other field
- `delete` is a flat list of widget ID strings

Converts to `BoardDiff` (same output as diff engine).

#### `sync.ts` — Sync Applier

Applies a `BoardDiff` to a board via the API:

Ordering:
1. Create areas first (need server IDs for `parentId` references)
2. Substitute `parentId` integer references with actual server IDs
3. Create remaining widgets (batched where possible)
4. Apply updates (one PATCH per widget)
5. Apply deletes (one DELETE per widget)

Returns `SyncReport`:
```typescript
interface SyncReport {
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
}
```

Supports `dryRun` mode — computes and returns the plan without applying.

#### `placement.ts` — Collision Avoidance

When creating widgets with a `parentId`, checks for overlapping widgets and nudges new ones to the first free position.

Algorithm: row-scan left-to-right, top-to-bottom, 20px padding between widgets. Uses the area's dimensions and existing widget positions to find gaps.

Input: existing widgets in the target area, new widget dimensions.
Output: adjusted (x, y) coordinates.

#### `html.ts` — HTML Normalization

Converts simple `<br />`-based HTML to Mural's native format:

Input: `<b>Title</b><br />Body text`
Output: `<html v="1"><div style="..."><span style="...">Title</span></div><div style="..."><span>Body text</span></div></html>`

Rules:
- `<br />` → new `<div>` block
- `<b>`, `<i>`, `<u>`, `<s>` → inline style spans
- Never use `<p>` tags (Mural strips them)
- If content is already in `<html v="1">` format, pass through unchanged

Applied automatically to `htmlText` and `text` fields before any API write.

#### `templates.ts` — Board Templates

Generates `BoardSpec` objects from named templates:

Available templates:
- `brainstorm` — topic areas with colored sticky notes
- `kanban` — columns (Backlog, WIP, Review, Done) with headers
- `retro` — columns (Went Well, To Improve, Actions) with colored areas
- `sprint_planning` — story cards with estimate areas
- `swot` — 2x2 grid (Strengths, Weaknesses, Opportunities, Threats)

Each template accepts:
- `title` — board/section title
- `items` — comma-separated list (meaning varies by template, see kastl README)

Templates use `palettes.ts` for colors.

#### `palettes.ts` — Color Palettes

Named color palettes with 8-char hex (with alpha):

Semantic palettes: `category`, `priority`, `retro`, `sentiment`, `status`, `swot`

Exports:
- `STICKY_COLORS` — all sticky note background colors (name → hex)
- `AREA_COLORS` — all area background colors (name → hex)
- `getPalette(name)` — returns `Record<string, string>`
- `paletteNames()` — returns available palette names

### Tools Layer (`src/tools/`)

Each file exports a single MCP tool definition with its handler. Tools are thin wrappers that:
1. Parse + validate input parameters
2. Call engine functions
3. Format output as MCP text result

#### `mural_extract_board`

| Param | Type | Required | Description |
|---|---|---|---|
| `url` | string | yes | Mural board URL |

Returns: Full board spec as JSON.

#### `mural_summary`

| Param | Type | Required | Description |
|---|---|---|---|
| `url` | string | yes | Mural board URL |

Returns: Compact summary JSON (area names, widget counts, tags).

#### `mural_query_widgets`

| Param | Type | Required | Description |
|---|---|---|---|
| `url` | string | yes | Mural board URL |
| `area` | string | no | Filter by area ID or title |
| `type` | string | no | Filter by widget type |
| `text` | string | no | Filter by text content |

Returns: Filtered widgets as JSON.

#### `mural_update_board`

| Param | Type | Required | Description |
|---|---|---|---|
| `url` | string | yes | Mural board URL |
| `spec` | string | yes | JSON spec (desired-state or explicit-ops) |
| `clear` | string | no | `"true"` for declarative sync |
| `dry_run` | string | no | `"true"` to preview without applying |
| `overlap` | string | no | `"warn"`, `"autofix"`, or `"debug"` |

Auto-detects input mode from JSON structure. Returns sync report.

#### `mural_create_board`

| Param | Type | Required | Description |
|---|---|---|---|
| `room_id` | string | yes | Mural room ID |
| `title` | string | yes | Board title |
| `spec` | string | yes | JSON spec for initial content |
| `clear` | string | no | `"true"` for declarative sync |
| `dry_run` | string | no | `"true"` to preview |

Creates a new board, then populates it with widgets from spec. Returns board URL + sync report.

## Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.29.0",
    "open": "^10.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

Minimal dependencies:
- `@modelcontextprotocol/sdk` — MCP server framework
- `open` — cross-platform browser opening for OAuth flow
- All HTTP via native `fetch` (Node 22)
- No Express needed (MCP SDK handles stdio transport)

## Token Storage

Tokens stored at `~/.mural-mcp/token.json`:

```json
{
  "access_token": "...",
  "expires_at": 1716000000.0
}
```

On first use, the plugin triggers the OAuth browser flow. Subsequent uses reuse the cached token until it expires.

## Error Handling

- Auth errors → clear cached token, instruct user to retry (will trigger fresh OAuth flow)
- API 4xx → return error message with status code and body
- API 429/5xx → retry with backoff (transparent to caller)
- Invalid spec JSON → return validation error before any API call
- Network timeouts → return error after 30s

## Testing Strategy

- Unit tests for: type maps, HTML normalization, diff engine, ops parser, placement algorithm, templates, palettes
- Integration tests (require real credentials): auth flow, board CRUD, widget sync
- Vitest as test runner (matches mail-mcp pattern)

## Differences from kastl

| Aspect | kastl | mural-mcp |
|---|---|---|
| Language | Python + Nushell + Go | TypeScript |
| Auth storage | macOS Keychain | File-based (`~/.mural-mcp/token.json`) |
| Write gate | Touch ID via auth provider | None (MCP permission model handles this) |
| SSL | Custom context (corporate proxy) | Node.js native (respects `NODE_EXTRA_CA_CERTS`) |
| Installation | Nix flake | `/plugin add <url>` |
| Runtime deps | Python 3, Nushell, Nix | Node.js 22 |
| CLI interface | `board.nu` commands | MCP tools only |
