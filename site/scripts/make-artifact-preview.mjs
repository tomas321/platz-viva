// Turns the built site into a self-contained folder with relative links, for previewing
// where the site can't be served from a domain root. The visit counter is left out (no backend there).
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync, readdirSync } from "node:fs";

const out = process.argv[2] ?? "preview";
rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/_astro`, { recursive: true });
const assets = new Set();

const pages = Object.fromEntries(
  readdirSync("src/i18n").filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5))
    .map((l) => [l, l === "en" ? "index.html" : `${l}.html`]),
);
for (const [lang, file] of Object.entries(pages)) {
  let html = readFileSync(`dist/${lang}/index.html`, "utf8");
  html = html.replace(/<script[^>]*count\.js[^>]*><\/script>/, "");
  for (const [l, f] of Object.entries(pages)) html = html.replaceAll(`href="/${l}/"`, `href="${f}"`);
  html = html.replaceAll('href="/favicon.svg"', 'href="favicon.svg"');
  for (const m of html.matchAll(/\/_astro\/[^"'\s,)]+/g)) assets.add(m[0]);
  html = html.replaceAll("/_astro/", "_astro/");
  writeFileSync(`${out}/${file}`, html);
}
for (const css of [...assets].filter((a) => a.endsWith(".css"))) {
  const text = readFileSync(`dist${css}`, "utf8");
  for (const m of text.matchAll(/\/_astro\/[^"'\s,)]+/g)) assets.add(m[0]);
  writeFileSync(`dist${css}.rel`, text.replaceAll("/_astro/", "./"));
}
for (const a of assets) {
  const src = existsSync(`dist${a}.rel`) ? `dist${a}.rel` : `dist${a}`;
  copyFileSync(src, `${out}${a}`);
}
copyFileSync("dist/favicon.svg", `${out}/favicon.svg`);
console.log(`${assets.size} assets → ${out}`);
