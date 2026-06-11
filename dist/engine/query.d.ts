import type { BoardSpec, SpecKey } from "../api/types.js";
export interface QueryOptions {
    area?: string;
    type?: SpecKey;
    text?: string;
}
export declare function queryWidgets(spec: BoardSpec, options: QueryOptions): BoardSpec;
//# sourceMappingURL=query.d.ts.map