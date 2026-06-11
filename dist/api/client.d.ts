import { type SpecKey, type Widget } from "./types.js";
export declare class MuralClient {
    private token;
    private ensureToken;
    request(method: string, path: string, body?: unknown): Promise<unknown>;
    getWidgets(muralId: string): Promise<Widget[]>;
    createWidgetsByType(muralId: string, specKey: SpecKey, widgets: Widget[]): Promise<Widget[]>;
    updateWidget(muralId: string, widgetId: string, specKey: SpecKey, fields: Partial<Widget>): Promise<Widget>;
    deleteWidget(muralId: string, widgetId: string): Promise<void>;
    createBoard(roomId: string, title: string): Promise<{
        id: string;
        url: string;
    }>;
}
//# sourceMappingURL=client.d.ts.map