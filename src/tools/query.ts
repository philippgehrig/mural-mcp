import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MuralClient } from "../api/client.js";
import { extractMuralId } from "../api/types.js";
import type { SpecKey } from "../api/types.js";
import { extractBoard } from "../engine/extract.js";
import { queryWidgets } from "../engine/query.js";

export function registerQueryTool(server: McpServer) {
  server.tool(
    "mural_query_widgets",
    "Query widgets on a Mural board with optional filters for area, type, and text content.",
    {
      url: z.string().describe("Mural board URL or ID"),
      area: z.string().optional().describe("Filter by area ID or title"),
      type: z.string().optional().describe("Filter by widget type (e.g. sticky_notes, titles)"),
      text: z.string().optional().describe("Filter by text content (substring match)"),
    },
    async ({ url, area, type, text }) => {
      const muralId = extractMuralId(url);
      const client = new MuralClient();
      const spec = await extractBoard(client, muralId);
      const result = queryWidgets(spec, {
        area,
        type: type as SpecKey | undefined,
        text,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );
}
