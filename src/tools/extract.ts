import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MuralClient } from "../api/client.js";
import { extractMuralId } from "../api/types.js";
import { extractBoard } from "../engine/extract.js";

export function registerExtractTool(server: McpServer) {
  server.tool(
    "mural_extract_board",
    "Extract all widgets from a Mural board, grouped by type. Returns the full board spec as JSON.",
    { url: z.string().describe("Mural board URL or ID") },
    async ({ url }) => {
      const muralId = extractMuralId(url);
      const client = new MuralClient();
      const spec = await extractBoard(client, muralId);
      return { content: [{ type: "text", text: JSON.stringify(spec, null, 2) }] };
    },
  );
}
