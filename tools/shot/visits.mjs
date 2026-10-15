import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [lang, n] of [["en", 3], ["sk", 2]]) {
  for (let i = 0; i < n; i++) {
    const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" });
    const page = await ctx.newPage();
    // navigator.webdriver is true under automation; hide it so this test behaves like a real visitor.
    await page.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
    await page.goto(`http://localhost:8788/${lang}/`, { waitUntil: "networkidle" });
    await page.reload({ waitUntil: "networkidle" });
    await ctx.close();
  }
}
await browser.close();
