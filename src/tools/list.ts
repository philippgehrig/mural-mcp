import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MuralClient } from "../api/client.js";

interface MuralListItem {
  id: string;
  title?: string;
  status?: string;
  createdOn?: string;
  updatedOn?: string;
  visitorsSettings?: unknown;
}

export function registerListTool(server: McpServer) {
  server.tool(
    "mural_list_boards",
    "List or search Mural boards in a workspace or room. Use 'title' to filter by name (case-insensitive substring match).",
    {
      workspaceId: z.string().optional().describe("Workspace ID to list boards from"),
      roomId: z.string().optional().describe("Room ID to list boards from (alternative to workspaceId)"),
      title: z.string().optional().describe("Filter boards by title (case-insensitive substring match)"),
      status: z.enum(["active", "archived"]).optional().describe("Filter by status (default: active)"),
      sortBy: z.enum(["lastCreated", "lastModified", "oldest"]).optional().describe("Sort order"),
      limit: z.number().optional().describe("Max results per page (default: 50)"),
    },
    async ({ workspaceId, roomId, title, status, sortBy, limit }) => {
      if (!workspaceId && !roomId) {
        const client = new MuralClient();
        const resp = (await client.request("GET", "/workspaces")) as Record<string, unknown>;
        const workspaces = unwrapList(resp);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              message: "No workspaceId or roomId provided. Here are your available workspaces:",
              workspaces,
            }, null, 2),
          }],
        };
      }

      const client = new MuralClient();
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (sortBy) params.set("sortBy", sortBy);
      if (limit) params.set("limit", String(limit));

      const basePath = roomId
        ? `/rooms/${encodeURIComponent(roomId)}/murals`
        : `/workspaces/${encodeURIComponent(workspaceId!)}/murals`;

      const query = params.toString();
      const path = query ? `${basePath}?${query}` : basePath;

      let allMurals: MuralListItem[] = [];
      let nextPath: string | null = path;

      while (nextPath) {
        const resp = (await client.request("GET", nextPath)) as Record<string, unknown>;
        const murals = unwrapList(resp) as MuralListItem[];
        allMurals = allMurals.concat(murals);
        nextPath = (resp.next as string) || null;
      }

      if (title) {
        const search = title.toLowerCase();
        allMurals = allMurals.filter((m) =>
          m.title?.toLowerCase().includes(search)
        );
      }

      const summary = allMurals.map((m) => {
        const [workspace, numericId] = m.id.split(".");
        return {
          id: m.id,
          title: m.title,
          status: m.status,
          url: `https://app.mural.co/t/${workspace}/m/${workspace}/${numericId}`,
        };
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ count: summary.length, boards: summary }, null, 2),
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
