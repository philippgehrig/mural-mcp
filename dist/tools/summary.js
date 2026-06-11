import { z } from "zod";
import { MuralClient } from "../api/client.js";
import { extractMuralId } from "../api/types.js";
import { extractBoard } from "../engine/extract.js";
import { summarizeBoard } from "../engine/summary.js";
export function registerSummaryTool(server) {
    server.tool("mural_summary", "Get a compact summary of a Mural board: area names, widget counts, and tags.", { url: z.string().describe("Mural board URL or ID") }, async ({ url }) => {
        const muralId = extractMuralId(url);
        const client = new MuralClient();
        const spec = await extractBoard(client, muralId);
        const summary = summarizeBoard(spec);
        return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
    });
}
//# sourceMappingURL=summary.js.map