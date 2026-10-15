const NAMES = { en: "English", sk: "Slovenčina", de: "Deutsch", es: "Español", ja: "日本語", uk: "Українська", zh: "中文" };
const fmt = new Intl.NumberFormat("en");
const SVG = "http://www.w3.org/2000/svg";

function el(tag, attrs = {}, text) {
  const n = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text != null) n.textContent = text;
  return n;
}

function fillDays(rows, days) {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    out.push({ day: d, visits: byDay.get(d)?.visits ?? 0, views: byDay.get(d)?.views ?? 0 });
  }
  return out;
}

function chart(rows) {
  const box = document.getElementById("chart");
  box.replaceChildren();
  const W = 640, H = 220, L = 34, B = 22, max = Math.max(1, ...rows.map((r) => r.visits));
  const step = niceStep(max), top = Math.ceil(max / step) * step;
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}` });
  for (let v = 0; v <= top; v += step) {
    const y = H - B - (v / top) * (H - B - 8);
    svg.append(el("line", { x1: L, x2: W, y1: y, y2: y, class: "grid" }), el("text", { x: L - 6, y: y + 4, "text-anchor": "end" }, fmt.format(v)));
  }
  const bw = (W - L) / rows.length;
  rows.forEach((r, i) => {
    const h = (r.visits / top) * (H - B - 8);
    const rect = el("rect", { x: L + i * bw + bw * 0.15, y: H - B - h, width: Math.max(1, bw * 0.7), height: h, rx: Math.min(3, bw * 0.2), class: "bar" });
    rect.append(el("title", {}, `${r.day}: ${fmt.format(r.visits)} visits, ${fmt.format(r.views)} views`));
    svg.append(rect);
  });
  const every = Math.ceil(rows.length / 6);
  rows.forEach((r, i) => {
    if (i % every === 0 || i === rows.length - 1) svg.append(el("text", { x: L + i * bw + bw / 2, y: H - 6, "text-anchor": "middle" }, r.day.slice(5)));
  });
  box.append(svg);
}

function niceStep(max) {
  const raw = max / 4, p = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map((m) => m * p).find((s) => s >= raw) || p;
}

function table(rows) {
  const body = document.querySelector("#langs tbody");
  const total = rows.reduce((s, r) => s + r.visits, 0) || 1;
  body.replaceChildren(
    ...(rows.length ? rows : [{ lang: "–", visits: 0, views: 0 }]).map((r) => {
      const tr = document.createElement("tr");
      for (const v of [NAMES[r.lang] ? `${NAMES[r.lang]} (${r.lang})` : r.lang, fmt.format(r.visits), fmt.format(r.views), `${Math.round((r.visits / total) * 100)}%`]) {
        const td = document.createElement("td");
        td.textContent = v;
        tr.append(td);
      }
      return tr;
    }),
  );
}

async function load(days) {
  const res = await fetch(`/api/stats?days=${days}`);
  if (!res.ok) throw new Error(res.status);
  const data = await res.json();
  const rows = fillDays(data.daily, days);
  document.getElementById("t-visits").textContent = fmt.format(rows.reduce((s, r) => s + r.visits, 0));
  document.getElementById("t-views").textContent = fmt.format(rows.reduce((s, r) => s + r.views, 0));
  document.getElementById("t-all").textContent = fmt.format(data.allTime.visits);
  chart(rows);
  table(data.languages);
}

document.querySelectorAll("nav button").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll("nav button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    load(+b.dataset.days).catch(() => {});
  }),
);
load(30).catch(() => { document.getElementById("chart").innerHTML = '<p class="empty">Statistics are unavailable right now.</p>'; });
