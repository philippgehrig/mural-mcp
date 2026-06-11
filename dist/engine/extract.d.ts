import type { Widget, BoardSpec } from "../api/types.js";
import { MuralClient } from "../api/client.js";
declare function stripServerFields(widget: Widget): Widget;
declare function emptySpec(): BoardSpec;
export declare function extractBoard(client: MuralClient, muralId: string): Promise<BoardSpec>;
export { stripServerFields, emptySpec };
//# sourceMappingURL=extract.d.ts.map