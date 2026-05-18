import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MuralClient } from "../api/client.js";

interface Room {
  id: string;
  name?: string;
  type?: string;
  description?: string;
}

export function registerListRoomsTool(server: McpServer) {
  server.tool(
    "mural_list_rooms",
    "List rooms in a Mural workspace.",
    {
      workspaceId: z.string().describe("Workspace ID to list rooms from"),
    },
    async ({ workspaceId }) => {
      const client = new MuralClient();
      let allRooms: Room[] = [];
      let nextPath: string | null = `/workspaces/${encodeURIComponent(workspaceId)}/rooms`;

      while (nextPath) {
        const resp = (await client.request("GET", nextPath)) as Record<string, unknown>;
        const rooms = unwrapList(resp) as Room[];
        allRooms = allRooms.concat(rooms);
        nextPath = (resp.next as string) || null;
      }

      const summary = allRooms.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
      }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ count: summary.length, rooms: summary }, null, 2),
        }],
      };
    },
  );
}

function unwrapList(data: Record<string, unknown>): unknown[] {
  if (Array.isArray(data.value)) return data.value;
  if (Array.isArray(data.data)) return data.data;
  return [];
}
