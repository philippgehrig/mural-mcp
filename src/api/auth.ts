import * as fs from "node:fs";
import * as path from "node:path";
import * as http from "node:http";
import * as crypto from "node:crypto";
import * as url from "node:url";
import open from "open";

const API_BASE = "https://app.mural.co/api/public/v1";
const AUTH_URL = `${API_BASE}/authorization/oauth2/`;
const TOKEN_URL = `${API_BASE}/authorization/oauth2/token`;
const CALLBACK_PORT = parseInt(process.env.MURAL_CALLBACK_PORT || "9876", 10);
const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}/callback`;
const CACHE_MARGIN_SECONDS = 60;

interface TokenData {
  access_token: string;
  expires_at: number;
}

function getTokenPath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || "~";
  return path.join(home, ".mural-mcp", "token.json");
}

function readCachedToken(): TokenData | null {
  const tokenPath = getTokenPath();
  try {
    const raw = fs.readFileSync(tokenPath, "utf-8");
    const data = JSON.parse(raw) as TokenData;
    if (data.access_token && data.expires_at) return data;
    return null;
  } catch {
    return null;
  }
}

function writeCachedToken(token: TokenData): void {
  const tokenPath = getTokenPath();
  const dir = path.dirname(tokenPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(tokenPath, JSON.stringify(token, null, 2), "utf-8");
}

export function clearCachedToken(): void {
  const tokenPath = getTokenPath();
  try {
    fs.unlinkSync(tokenPath);
  } catch {
    // ignore if file doesn't exist
  }
}

function isTokenValid(token: TokenData): boolean {
  return Date.now() / 1000 < token.expires_at - CACHE_MARGIN_SECONDS;
}

async function runOAuthFlow(
  clientId: string,
  clientSecret: string,
): Promise<TokenData> {
  const state = crypto.randomBytes(16).toString("hex");

  return new Promise<TokenData>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const parsed = new URL(req.url!, `http://localhost:${CALLBACK_PORT}`);
      if (parsed.pathname !== "/callback") {
        res.writeHead(404);
        res.end();
        return;
      }

      const error = parsed.searchParams.get("error");
      if (error) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Authorization failed. Close this tab.");
        server.close();
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      const code = parsed.searchParams.get("code");
      const returnedState = parsed.searchParams.get("state");

      if (returnedState !== state) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("State mismatch. Close this tab.");
        server.close();
        reject(new Error("OAuth state mismatch (possible CSRF)"));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Authorization successful! You can close this tab.");
      server.close();

      try {
        const token = await exchangeCode(code!, clientId, clientSecret);
        resolve(token);
      } catch (err) {
        reject(err);
      }
    });

    server.listen(CALLBACK_PORT, () => {
      const params = new url.URLSearchParams({
        client_id: clientId,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        state,
        scope: "murals:read murals:write workspaces:read",
      });
      const authUrl = `${AUTH_URL}?${params.toString()}`;
      open(authUrl).catch(() => {
        console.error(
          `Open this URL in your browser:\n${authUrl}`,
        );
      });
    });

    setTimeout(() => {
      server.close();
      reject(new Error("OAuth flow timed out after 120 seconds"));
    }, 120_000);
  });
}

async function exchangeCode(
  code: string,
  clientId: string,
  clientSecret: string,
): Promise<TokenData> {
  const body = new url.URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: REDIRECT_URI,
  });

  const resp = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token exchange failed (${resp.status}): ${text}`);
  }

  const data = await resp.json();
  const expiresIn = data.expires_in || 3600;
  const token: TokenData = {
    access_token: data.access_token,
    expires_at: Date.now() / 1000 + expiresIn,
  };
  writeCachedToken(token);
  return token;
}

export async function getAccessToken(): Promise<string> {
  const clientId = process.env.MURAL_CLIENT_ID;
  const clientSecret = process.env.MURAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "MURAL_CLIENT_ID and MURAL_CLIENT_SECRET must be set",
    );
  }

  const cached = readCachedToken();
  if (cached && isTokenValid(cached)) {
    return cached.access_token;
  }

  const token = await runOAuthFlow(clientId, clientSecret);
  return token.access_token;
}

// Exported for testing
export { readCachedToken, writeCachedToken, isTokenValid, getTokenPath };
