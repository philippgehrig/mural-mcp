import type { BoardDiff, SyncReport } from "../api/types.js";
import { MuralClient } from "../api/client.js";
export declare function applyDiff(client: MuralClient, muralId: string, diff: BoardDiff, options?: {
    dryRun?: boolean;
}): Promise<SyncReport>;
//# sourceMappingURL=sync.d.ts.map