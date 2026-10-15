// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  // Set SITE_URL in the deploy environment (e.g. https://zive-namestie.pages.dev) for canonical/hreflang URLs.
  site: process.env.SITE_URL || "https://zive-namestie.pages.dev",
  output: "static",
  trailingSlash: "always",
  build: {
    // Keep CSS in files so the Content-Security-Policy can forbid inline styles.
    inlineStylesheets: "never",
  },
  devToolbar: { enabled: false },
});
