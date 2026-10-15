/// <reference types="@cloudflare/workers-types" />
// Admin gate for the whole stats project (page + API).
// Primary protection is a Cloudflare Access application in front of this Pages project.
// This middleware re-checks the Access JWT so the page stays closed even if Access is
// misconfigured or the *.pages.dev URL is hit directly. It fails closed: no config → 403.
interface Env {
  ACCESS_TEAM_DOMAIN?: string; // e.g. "yourteam.cloudflareaccess.com"
  ACCESS_AUD?: string; // Application Audience (AUD) tag from the Access application
  DEV_ALLOW_UNAUTHENTICATED?: string; // "1" only in .dev.vars for local `wrangler pages dev`
}

type Jwk = JsonWebKey & { kid: string };
let jwksCache: { url: string; keys: Jwk[]; at: number } | undefined;

const b64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
const json = (s: string) => JSON.parse(new TextDecoder().decode(b64url(s)));

async function keys(team: string, force = false): Promise<Jwk[]> {
  const url = `https://${team}/cdn-cgi/access/certs`;
  if (!force && jwksCache?.url === url && Date.now() - jwksCache.at < 600_000) return jwksCache.keys;
  const res = await fetch(url);
  if (!res.ok) throw new Error("jwks");
  jwksCache = { url, keys: ((await res.json()) as { keys: Jwk[] }).keys, at: Date.now() };
  return jwksCache.keys;
}

async function verify(token: string, env: Required<Pick<Env, "ACCESS_TEAM_DOMAIN" | "ACCESS_AUD">>): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [h, p, s] = parts as [string, string, string];
  const header = json(h), payload = json(p);
  if (header.alg !== "RS256" || typeof header.kid !== "string") return false;

  let jwk = (await keys(env.ACCESS_TEAM_DOMAIN)).find((k) => k.kid === header.kid);
  if (!jwk) jwk = (await keys(env.ACCESS_TEAM_DOMAIN, true)).find((k) => k.kid === header.kid); // key rotation
  if (!jwk) return false;

  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(s), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) return false;

  const now = Math.floor(Date.now() / 1000);
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  return payload.iss === `https://${env.ACCESS_TEAM_DOMAIN}` && aud.includes(env.ACCESS_AUD) && typeof payload.exp === "number" && payload.exp > now - 30 && (payload.nbf ?? 0) <= now + 30;
}

const deny = () => new Response("Forbidden", { status: 403, headers: { "cache-control": "no-store", "content-type": "text/plain" } });

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  let allowed = false;
  if (env.DEV_ALLOW_UNAUTHENTICATED === "1" && new URL(request.url).hostname === "localhost") {
    allowed = true;
  } else if (env.ACCESS_TEAM_DOMAIN && env.ACCESS_AUD) {
    const token = request.headers.get("cf-access-jwt-assertion");
    try {
      allowed = !!token && (await verify(token, { ACCESS_TEAM_DOMAIN: env.ACCESS_TEAM_DOMAIN, ACCESS_AUD: env.ACCESS_AUD }));
    } catch {
      allowed = false;
    }
  }
  if (!allowed) return deny();

  const res = await next();
  const out = new Response(res.body, res);
  out.headers.set("cache-control", "private, no-store");
  return out;
};
