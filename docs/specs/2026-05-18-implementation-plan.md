# Mural MCP Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement this plan. Each phase is an independent unit of work.

**Goal:** TypeScript MCP plugin for Mural board management, matching kastl feature parity.

**Tech Stack:** TypeScript, @modelcontextprotocol/sdk, Node 22 native fetch, vitest

---

## Phase 1: Project Scaffold + API Types

**Files to create:**
- `package.json`, `tsconfig.json`, `vitest.config.ts`
- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`
- `.mcp.json`
- `src/api/types.ts`
- `src/index.ts` (stub)
- `tests/api/types.test.ts`

**Steps:**
- [ ] Init npm project (type: module, node >=22)
- [ ] Add deps: `@modelcontextprotocol/sdk`, `open`
- [ ] Add devDeps: `typescript`, `tsx`, `vitest`, `@types/node`
- [ ] Create tsconfig (ESM, strict, outDir: dist)
- [ ] Create `.claude-plugin/plugin.json` with userConfig (mural_client_id, mural_client_secret, mural_workspace)
- [ ] Create `.mcp.json` pointing to `dist/index.js`
- [ ] Implement `src/api/types.ts`: TYPE_MAP, apiTypeToSpecKey, specKeyToEndpoint, specKeyIsBatched, extractMuralId, SPEC_KEYS, SERVER_ONLY_FIELDS, Widget/BoardSpec/BoardDiff interfaces
- [ ] Write tests for type map functions and extractMuralId
- [ ] Create stub `src/index.ts` that starts MCP server with no tools
- [ ] Commit

---

## Phase 2: OAuth2 Auth Flow

**Files to create:**
- `src/api/auth.ts`
- `tests/api/auth.test.ts`

**Steps:**
- [ ] Implement token storage (read/write `~/.mural-mcp/token.json`)
- [ ] Implement token expiry check (60s margin)
- [ ] Implement OAuth2 Authorization Code flow: local HTTP server on port 9876, CSRF state, browser open, callback capture, token exchange
- [ ] Write unit tests for: token cache read/write, expiry logic, URL construction
- [ ] Commit

---

## Phase 3: HTTP Client

**Files to create:**
- `src/api/client.ts`
- `tests/api/client.test.ts`

**Steps:**
- [ ] Implement MuralClient class with `request(method, path, body?)` using native fetch
- [ ] Add Bearer token injection from auth module
- [ ] Add retry logic (429, 5xx — 3 retries, 1s/2s/4s backoff)
- [ ] Add response unwrapping (value/data arrays)
- [ ] Implement: getWidgets (paginated), createWidgetsByType (batched vs individual), updateWidget, deleteWidget, createBoard
- [ ] Write unit tests with mocked fetch for: retry behavior, response unwrapping, batching routing
- [ ] Commit

---

## Phase 4: HTML Normalization

**Files to create:**
- `src/engine/html.ts`
- `tests/engine/html.test.ts`

**Steps:**
- [ ] Port `normalize_html_text`: detect `<html v="1">` passthrough, split on `<br />`, wrap in `<div><span>`, handle `<b>` blocks
- [ ] Port `normalizeWidgetHtml`: shallow copy widget with normalized htmlText
- [ ] Write tests matching Python doctests: plain text passthrough, br conversion, bold wrapping, already-native passthrough, empty string
- [ ] Commit

---

## Phase 5: Extract + Summary + Query

**Files to create:**
- `src/engine/extract.ts`
- `src/engine/summary.ts`
- `src/engine/query.ts`
- `tests/engine/extract.test.ts`
- `tests/engine/query.test.ts`

**Steps:**
- [ ] Implement extract: fetch widgets, group by spec key, strip SERVER_ONLY_FIELDS, preserve id
- [ ] Implement summary: count widgets per type, list areas with titles, list tags
- [ ] Implement query: filter by area (parentId match or title match), by type (spec key), by text (substring in htmlText/text/title)
- [ ] Write tests for: grouping logic, field stripping, query filtering
- [ ] Commit

---

## Phase 6: Diff Engine + Ops Parser

**Files to create:**
- `src/engine/diff.ts`
- `src/engine/ops.ts`
- `tests/engine/diff.test.ts`
- `tests/engine/ops.test.ts`

**Steps:**
- [ ] Port compute_diff: ID-match → update/skip, position-match (5px tolerance) → update/create, unmatched server → delete
- [ ] Port _changed_fields: skip id, skip integer parentId, compare stripped fields
- [ ] Implement ops parser: validate create (no id), update (has id + fields), delete (string array)
- [ ] Write tests: identical widgets → unchanged, field diff → update, no match → create, clear mode → deletes, stale ID → error
- [ ] Write tests for ops: valid input, missing id on update → error, id on create → error
- [ ] Commit

---

## Phase 7: Placement + Sync

**Files to create:**
- `src/engine/placement.ts`
- `src/engine/sync.ts`
- `tests/engine/placement.test.ts`
- `tests/engine/sync.test.ts`

**Steps:**
- [ ] Port Rect class with overlaps()
- [ ] Port find_free_position: row-scan, padding, area title height offset
- [ ] Port auto_place_widgets: kept/nudged/placed/error
- [ ] Implement sync applier: delete → create areas → resolve parentId → create rest (batched) → update
- [ ] Implement dry-run mode
- [ ] Write tests for: placement in empty area, collision nudging, area overflow error
- [ ] Write tests for: parentId resolution, creation ordering, dry-run returns plan
- [ ] Commit

---

## Phase 8: Templates + Palettes

**Files to create:**
- `src/engine/templates.ts`
- `src/engine/palettes.ts`
- `src/engine/layouts.ts`
- `tests/engine/templates.test.ts`
- `tests/engine/palettes.test.ts`

**Steps:**
- [ ] Port STICKY_COLORS, AREA_COLORS, _PALETTES, palette(), paletteNames(), autoColor()
- [ ] Port grid_layout, flow_layout, kanban_layout, grid_bounds
- [ ] Port templates: retro, kanban, brainstorm, swot, sprint_planning (skip demo)
- [ ] Write tests: palette lookup, unknown palette error, template generation produces valid spec
- [ ] Commit

---

## Phase 9: MCP Tools + Server Wiring

**Files to create:**
- `src/tools/extract.ts`
- `src/tools/summary.ts`
- `src/tools/query.ts`
- `src/tools/update.ts`
- `src/tools/create.ts`
- `src/index.ts` (full implementation)

**Steps:**
- [ ] Define each tool with MCP SDK (name, description, input schema with zod)
- [ ] Implement handlers: parse params, call engine, return JSON text result
- [ ] Wire all tools into index.ts MCP server
- [ ] Add auth initialization (lazy on first tool call)
- [ ] Test: `npm run build` succeeds, `node dist/index.js` starts without error
- [ ] Commit

---

## Phase 10: Plugin Packaging + README

**Files to create/update:**
- `README.md`
- `.claude-plugin/marketplace.json`

**Steps:**
- [ ] Write README: what it does, prerequisites (OAuth app registration), installation (`/plugin add <url>`), available tools, configuration
- [ ] Verify `.claude-plugin/` structure matches mail-mcp pattern
- [ ] Final `npm run build` + verify dist/ output
- [ ] Push to origin
