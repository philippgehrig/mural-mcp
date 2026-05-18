import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MuralClient } from "../api/client.js";
import { extractMuralId } from "../api/types.js";
import type { BoardSpec, ExplicitOps } from "../api/types.js";
import { extractBoard } from "../engine/extract.js";
import { computeDiff } from "../engine/diff.js";
import { parseExplicitOps } from "../engine/ops.js";
import { applyDiff } from "../engine/sync.js";

export function registerUpdateTool(server: McpServer) {
  server.tool(
    "mural_update_board",
    "Update a Mural board. Accepts either a desired-state spec (computes diff automatically) or explicit operations (create/update/delete). Use dry_run to preview changes.",
    {
      url: z.string().describe("Mural board URL or ID"),
      spec: z.string().describe("JSON spec: desired-state BoardSpec or ExplicitOps {create, update, delete}"),
      clear: z.string().optional().describe("Set to 'true' for declarative sync (deletes unmatched widgets)"),
      dry_run: z.string().optional().describe("Set to 'true' to preview without applying"),
    },
    async ({ url, spec: specStr, clear, dry_run }) => {
      const muralId = extractMuralId(url);
      const client = new MuralClient();
      const dryRun = dry_run === "true";

      const parsed = JSON.parse(specStr);

      // Auto-detect mode: if it has create/update/delete keys, it's explicit ops
      const isExplicitOps = "create" in parsed || "update" in parsed || "delete" in parsed;

      let diff;
      if (isExplicitOps) {
        diff = parseExplicitOps(parsed as ExplicitOps);
      } else {
        const serverSpec = await extractBoard(client, muralId);
        diff = computeDiff(serverSpec, parsed as BoardSpec);
        // If not in clear mode, don't delete unmatched server widgets
        if (clear !== "true") {
          diff.deletes = [];
        }
      }

      const report = await applyDiff(client, muralId, diff, { dryRun });
      return { content: [{ type: "text", text: JSON.stringify(report, null, 2) }] };
    },
  );
}
