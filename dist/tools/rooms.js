import { z } from "zod";
import { MuralClient } from "../api/client.js";
export function registerListRoomsTool(server) {
    server.tool("mural_list_rooms", "List rooms in a Mural workspace.", {
        workspaceId: z.string().describe("Workspace ID to list rooms from"),
    }, async ({ workspaceId }) => {
        const client = new MuralClient();
        let allRooms = [];
        let nextPath = `/workspaces/${encodeURIComponent(workspaceId)}/rooms`;
        while (nextPath) {
            const resp = (await client.request("GET", nextPath));
            const rooms = unwrapList(resp);
            allRooms = allRooms.concat(rooms);
            nextPath = resp.next || null;
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
    });
}
function unwrapList(data) {
    if (Array.isArray(data.value))
        return data.value;
    if (Array.isArray(data.data))
        return data.data;
    return [];
}
//# sourceMappingURL=rooms.js.map