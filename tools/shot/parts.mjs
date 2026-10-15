import { chromium } from "playwright";
const [url, out] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
await p.goto(url, { waitUntil: "networkidle" });
for (const id of ["circles", "rain", "stops", "circleCloses", "barriers"]) {
  const el = p.locator(`#${id}`);
  await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await el.screenshot({ path: `${out}-${id}.png` });
}
console.log(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
await b.close();
