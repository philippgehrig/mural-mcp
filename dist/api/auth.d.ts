interface TokenData {
    access_token: string;
    expires_at: number;
}
declare function getTokenPath(): string;
declare function readCachedToken(): TokenData | null;
declare function writeCachedToken(token: TokenData): void;
export declare function clearCachedToken(): void;
declare function isTokenValid(token: TokenData): boolean;
export declare function getAccessToken(): Promise<string>;
export { readCachedToken, writeCachedToken, isTokenValid, getTokenPath };
//# sourceMappingURL=auth.d.ts.map