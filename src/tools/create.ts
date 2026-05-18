import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MuralClient } from "../api/client.js";
import type { BoardSpec } from "../api/types.js";
import { computeDiff } from "../engine/diff.js";
import { applyDiff } from "../engine/sync.js";
import { loadTemplate, templateNames } from "../engine/templates.js";

function emptySpec(): BoardSpec {
  return { areas: [], sticky_notes: [], textboxes: [], titles: [], shapes: [], arrows: [] };
}

export function registerCreateTool(server: McpServer) {
  server.tool(
    "mural_create_board",
    "Create a new Mural board and populate it with widgets. Accepts a JSON spec or a template name.",
    {
      room_id: z.string().describe("Mural room/workspace ID"),
      title: z.string().describe("Board title"),
      spec: z.string().optional().describe("JSON spec for initial content, or a template name (retro, kanban, brainstorm, swot, sprint_planning)"),
      template_options: z.string().optional().describe("JSON options for template (e.g. columns, topics)"),
      dry_run: z.string().optional().describe("Set to 'true' to preview without applying"),
    },
    async ({ room_id, title, spec: specStr, template_options, dry_run }) => {
      const client = new MuralClient();
      const dryRun = dry_run === "true";

      // Create the board
      let boardUrl = "";
      let muralId = "";
      if (!dryRun) {
        const board = await client.createBoard(room_id, title);
        muralId = board.id;
        boardUrl = board.url;
      }

      // Determine content spec
      let desiredSpec: BoardSpec;
      if (specStr && templateNames().includes(specStr)) {
        const opts = template_options ? JSON.parse(template_options) : {};
        opts.title = opts.title || title;
        desiredSpec = loadTemplate(specStr, opts);
      } else if (specStr) {
        desiredSpec = JSON.parse(specStr);
      } else {
        desiredSpec = emptySpec();
      }

      // Populate the board
      const diff = computeDiff(emptySpec(), desiredSpec);
      const report = await applyDiff(client, muralId, diff, { dryRun });

      const result = { url: boardUrl, ...report };
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );
}
