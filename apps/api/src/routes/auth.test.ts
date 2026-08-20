import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";

const app = createApp();
const CALLBACK_URL = "https://stage.kleeblatt.space/auth/google/callback";

afterEach(() => {
  vi.unstubAllGlobals();
});

function setCookieValue(response: Response, name: string): string | undefined {
  const raw = response.headers.getSetCookie().find((entry) => entry.startsWith(`${name}=`));
  if (!raw) return undefined;
  return raw.slice(name.length + 1).split(";")[0];
}

describe("Dual-Mount: Root-Alias + /api", () => {
  it("serviert /health am Root und unter /api", async () => {
    expect((await app.request("/health")).status).toBe(200);
    expect((await app.request("/api/health")).status).toBe(200);
  });

  it("serviert /auth/status auch am Root (Legacy-Alias)", async () => {
    expect((await app.request("/auth/status")).status).toBe(200);
  });
});

describe("auth/status", () => {
  it("meldet Konfiguration ohne Secrets", async () => {
    const res = await app.request("/api/auth/status");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      configured: boolean;
      clientIdSet: boolean;
      clientSecretSet: boolean;
      callbackUrl: string;
    };
    expect(body.configured).toBe(true);
    expect(body.clientIdSet).toBe(true);
    expect(body.clientSecretSet).toBe(true);
    expect(body.callbackUrl).toBe(CALLBACK_URL);
  });
});

describe("auth/google (Start)", () => {
  it("leitet zu Google weiter und setzt State-Cookie", async () => {
    const res = await app.request("/api/auth/google");
    expect(res.status).toBe(302);
    const location = res.headers.get("location") ?? "";
    expect(location.startsWith("https://accounts.google.com/o/oauth2/v2/auth?")).toBe(true);
    expect(location).toContain(encodeURIComponent(CALLBACK_URL));
    const url = new URL(location);
    expect(url.searchParams.get("state")).toBeTruthy();
    expect(setCookieValue(res, "kleeblatt_oauth_state")).toBe(url.searchParams.get("state"));
  });
});

describe("auth/google/callback", () => {
  it("fehlender Code → auth=error&reason=missing_code", async () => {
    const res = await app.request("/api/auth/google/callback");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "https://stage.kleeblatt.space/?auth=error&reason=missing_code",
    );
  });

  it("Google-Fehler (z.B. redirect_uri_mismatch) → reason=oauth mit Detail", async () => {
    const res = await app.request("/api/auth/google/callback?error=redirect_uri_mismatch");
    expect(res.status).toBe(302);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("auth=error&reason=oauth");
    expect(location).toContain(encodeURIComponent("redirect_uri_mismatch"));
  });

  it("fehlender/ungültiger State-Cookie → reason=state (CSRF-Schutz)", async () => {
    const res = await app.request("/api/auth/google/callback?code=abc&state=irgendwas");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("reason=state");
  });

  it("Token-Austausch-Fehler → reason=token_exchange", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("invalid_client", { status: 400 })),
    );
    const start = await app.request("/api/auth/google");
    const state = setCookieValue(start, "kleeblatt_oauth_state");
    const url = new URL(start.headers.get("location") ?? "");
    const res = await app.request(
      `/api/auth/google/callback?code=abc&state=${url.searchParams.get("state")}`,
      { headers: { Cookie: `kleeblatt_oauth_state=${state}` } },
    );
    expect(res.status).toBe(302);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("reason=token_exchange");
    expect(location).toContain(encodeURIComponent("invalid_client"));
  });

  it("erfolgreicher Login → auth=ok + Session-Cookie", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input);
        if (url.includes("oauth2.googleapis.com/token")) {
          return new Response(JSON.stringify({ access_token: "token-123" }), { status: 200 });
        }
        if (url.includes("googleapis.com/oauth2/v2/userinfo")) {
          return new Response(
            JSON.stringify({ id: "google-1", email: "test@kleeblatt.space", name: "Test" }),
            { status: 200 },
          );
        }
        return new Response("not found", { status: 404 });
      }),
    );
    const start = await app.request("/api/auth/google");
    const state = setCookieValue(start, "kleeblatt_oauth_state");
    const url = new URL(start.headers.get("location") ?? "");
    const res = await app.request(
      `/api/auth/google/callback?code=abc&state=${url.searchParams.get("state")}`,
      { headers: { Cookie: `kleeblatt_oauth_state=${state}` } },
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://stage.kleeblatt.space/?auth=ok");
    expect(setCookieValue(res, "kleeblatt_session")).toBeTruthy();
    // State-Cookie muss gelöscht sein (Einmalgebrauch)
    const stateCookie = res.headers
      .getSetCookie()
      .find((entry) => entry.startsWith("kleeblatt_oauth_state="));
    expect(stateCookie).toBeTruthy();
    expect(stateCookie?.toLowerCase()).toContain("max-age=0");
  });
});

describe("auth/email-password", () => {
  const EMAIL = "alpha@example.com";
  const PASSWORD = "Password123";

  it("registriert einen neuen Nutzer und setzt ein Session-Cookie", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: boolean; me: { email: string; hero: unknown } };
    expect(body.ok).toBe(true);
    expect(body.me.email).toBe(EMAIL);
    expect(body.me.hero).toBeNull();
    expect(setCookieValue(res, "kleeblatt_session")).toBeTruthy();
  });

  it("check-email meldet belegte und freie Adressen korrekt", async () => {
    const taken = await app.request(`/api/auth/check-email?email=${encodeURIComponent(EMAIL)}`);
    expect((await taken.json())).toEqual({ available: false, valid: true });

    const free = await app.request(
      `/api/auth/check-email?email=${encodeURIComponent("beta@example.com")}`,
    );
    expect((await free.json())).toEqual({ available: true, valid: true });

    const invalid = await app.request("/api/auth/check-email?email=not-an-email");
    expect((await invalid.json())).toEqual({ available: false, valid: false });
  });

  it("lehnt doppelte Registrierung mit 409 ab", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    expect(res.status).toBe(409);
  });

  it("lehnt zu schwaches Passwort mit 400 ab", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "gamma@example.com", password: "weak" }),
    });
    expect(res.status).toBe(400);
  });

  it("login mit falschem Passwort → 401", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: "WrongPassword1" }),
    });
    expect(res.status).toBe(401);
  });

  it("login mit korrektem Passwort → 200 + Session-Cookie", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    expect(res.status).toBe(200);
    expect(setCookieValue(res, "kleeblatt_session")).toBeTruthy();
  });
});
