/// <reference types="@cloudflare/workers-types" />
// POST /api/hit  {"l":"en","v":1}  → increments today's counters for that language.
import { LANGUAGES } from "../_languages";

interface Env {
  DB: D1Database;
  RATE_LIMITER?: RateLimit;
}

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python|httpclient/i;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // Same-origin browser requests only.
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return new Response(null, { status: 403 });
  if (BOT.test(request.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });

  if (env.RATE_LIMITER) {
    // Keyed per client IP inside Cloudflare's limiter only; the IP is never written anywhere.
    const { success } = await env.RATE_LIMITER.limit({ key: request.headers.get("cf-connecting-ip") ?? "anon" });
    if (!success) return new Response(null, { status: 429 });
  }

  const raw = await request.text();
  if (raw.length > 64) return new Response(null, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }
  const { l, v } = (body ?? {}) as { l?: unknown; v?: unknown };
  if (typeof l !== "string" || !LANGUAGES.includes(l)) return new Response(null, { status: 400 });
  const visit = v === 1 ? 1 : 0;

  const day = new Date().toISOString().slice(0, 10);
  await env.DB.prepare(
    `INSERT INTO daily (day, lang, views, visits) VALUES (?1, ?2, 1, ?3)
     ON CONFLICT (day, lang) DO UPDATE SET views = views + 1, visits = visits + ?3`,
  )
    .bind(day, l, visit)
    .run();

  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
};

export const onRequest: PagesFunction = () => new Response(null, { status: 405, headers: { allow: "POST" } });
