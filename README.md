# mural-mcp

Mural board management for Claude Code via MCP. Extract, update, create, and query Mural boards directly from your Claude Code sessions.

## Features

- **Extract** — fetch full board content as structured JSON
- **Summary** — get a compact overview (areas, widget counts, tags)
- **Query** — filter widgets by area, type, or text content
- **Update** — sync changes to a board (desired-state or explicit operations)
- **Create** — create new boards with templates or custom specs

## Prerequisites

- Node.js >= 22
- A Mural account with API access
- A Mural OAuth app (client ID + secret)

### Creating a Mural OAuth App

1. Go to https://app.mural.co/me/apps
2. Click "Create new app"
3. Set the redirect URI to `http://localhost:9876/callback`
4. Note your **Client ID** and **Client Secret**

## Installation

### As a Claude Code Plugin (Marketplace)

Add the marketplace, then install the plugin:

```bash
claude /plugin marketplace add https://github.com/philippgehrig/mural-mcp.git
claude /plugin add mural
```

During installation you'll be prompted for:
- **Mural OAuth Client ID** — from your Mural app
- **Mural OAuth Client Secret** — from your Mural app
- **Default workspace** (optional) — auto-detected from board URLs if not set

### Direct Plugin Install

If you have the repo cloned locally:

```bash
claude /plugin add /path/to/mural-mcp
```

### Manual MCP Configuration

Add to your `.claude/settings.json` or project `.mcp.json`:

```json
{
  "mcpServers": {
    "mural": {
      "command": "node",
      "args": ["/path/to/mural-mcp/dist/index.js"],
      "env": {
        "MURAL_CLIENT_ID": "your-client-id",
        "MURAL_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

## Authentication

On first use, the plugin opens your browser for OAuth authorization. The token is cached at `~/.mural-mcp/token.json` and reused until expiry.

If authentication expires, the next tool call will automatically trigger a fresh OAuth flow.

## Available Tools

| Tool | Description |
|------|-------------|
| `mural_extract_board` | Fetch all widgets from a board as structured JSON |
| `mural_summary` | Get area names, widget counts, and tags |
| `mural_query_widgets` | Filter widgets by area, type, or text |
| `mural_update_board` | Apply changes (desired-state diff or explicit create/update/delete) |
| `mural_create_board` | Create a new board with initial content |

## Development

```bash
npm install
npm run build
npm run dev      # run with tsx (no build needed)
npm test         # run tests
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MURAL_CLIENT_ID` | OAuth app client ID | (required) |
| `MURAL_CLIENT_SECRET` | OAuth app client secret | (required) |
| `MURAL_WORKSPACE` | Default workspace ID | (auto-detected) |
| `MURAL_CALLBACK_PORT` | OAuth callback port | `9876` |

## License

MIT
