import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerExtractTool } from "./tools/extract.js";
import { registerSummaryTool } from "./tools/summary.js";
import { registerQueryTool } from "./tools/query.js";
import { registerUpdateTool } from "./tools/update.js";
import { registerCreateTool } from "./tools/create.js";

const server = new McpServer({
  name: "mural",
  version: "0.1.0",
});

registerExtractTool(server);
registerSummaryTool(server);
registerQueryTool(server);
registerUpdateTool(server);
registerCreateTool(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
