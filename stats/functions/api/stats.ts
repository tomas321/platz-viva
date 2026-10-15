/// <reference types="@cloudflare/workers-types" />
// GET /api/stats?days=30  → aggregate counts only. Read-only, never cached (admin-only, see _middleware.ts).
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const days = Math.min(Math.max(parseInt(url.searchParams.get("days") ?? "30", 10) || 30, 1), 365);
  const since = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);

  const [daily, langs, total] = await env.DB.batch([
    env.DB.prepare("SELECT day, SUM(views) AS views, SUM(visits) AS visits FROM daily WHERE day >= ?1 GROUP BY day ORDER BY day").bind(since),
    env.DB.prepare("SELECT lang, SUM(views) AS views, SUM(visits) AS visits FROM daily WHERE day >= ?1 GROUP BY lang ORDER BY views DESC").bind(since),
    env.DB.prepare("SELECT COALESCE(SUM(views),0) AS views, COALESCE(SUM(visits),0) AS visits, MIN(day) AS first FROM daily"),
  ]);

  return Response.json(
    { days, since, daily: daily!.results, languages: langs!.results, allTime: total!.results[0] },
    { headers: { "cache-control": "private, no-store" } },
  );
};
