# Živé námestie: the poster exhibition as a web page

A vertical, phone-first retelling of the "Živé námestie oživa" exhibition on Námestie SNP, Bratislava,
plus a separate page that shows visit counts.

```
site/    Astro static site + one Cloudflare Pages Function (POST /api/hit) that counts visits
stats/   Separate, admin-only stats page + Pages Function (GET /api/stats) that reads the counts
db/      D1 (SQLite) schema shared by both
tools/   Scripts used once to crop images out of the poster photos
```

## Add a language

1. Copy `site/src/i18n/en.json` to `site/src/i18n/<code>.json` (e.g. `de.json`, `uk.json`, `zh.json`).
2. Translate the values. Keep the keys. Text may use `**bold**`; nothing else is interpreted.
3. `npm run build` in `site/`. The build fails and names the key if anything is missing.

That's all: routes (`/de/`), the language switcher, hreflang tags, browser-language redirect and the
counter's allow-list are all generated from the files in `src/i18n/`. Japanese, Chinese and Korean
switch to suitable system fonts automatically (see `:lang()` rules in `src/styles/global.css`).
Optionally add the language's display name to `NAMES` in `stats/public/stats.js`.

## Run locally

```sh
cd site && npm ci
npx wrangler d1 execute zive-namestie-stats --local --persist-to ../.wrangler-state --file ../db/schema.sql
npm run build
npx wrangler pages dev dist --port 8788 --persist-to ../.wrangler-state          # site
cp ../stats/.dev.vars.example ../stats/.dev.vars    # lets http://localhost:8789 in without Cloudflare Access
cd ../stats && npx wrangler pages dev public --port 8789 --persist-to ../.wrangler-state   # stats
```

## Deploy to Cloudflare (free tier)

```sh
npx wrangler login
npx wrangler d1 create zive-namestie-stats              # put the printed database_id in both wrangler.toml files
npx wrangler d1 execute zive-namestie-stats --remote --file db/schema.sql
cd site && SITE_URL=https://<your-domain> npm run build && npx wrangler pages deploy
cd ../stats && npx wrangler pages deploy
```

Or connect the GitHub repo to two Cloudflare Pages projects (root `site/`, build `npm run build`, output
`dist`; and root `stats/`, no build, output `public`) and bind the D1 database as `DB` in both.

### Make the stats page admin-only

The stats project returns 403 for every request until it can verify a Cloudflare Access login.

1. Cloudflare dashboard → Zero Trust → Access → Applications → Add → Self-hosted. Domain: the stats
   project's hostname (e.g. `stats.<your-domain>` and `<project>.pages.dev`). Policy: Allow, Emails = the admins.
2. Copy the application's Audience (AUD) tag and your team domain (`<team>.cloudflareaccess.com`).
3. Set `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` in `stats/wrangler.toml` (or Pages → Settings → Variables) and redeploy.

Access asks admins to log in (one-time email code by default). `stats/functions/_middleware.ts` then
checks the signed Access token on every request, page and API alike, and fails closed.

Recommended: in Cloudflare → Security → WAF, add a rate-limiting rule for `POST /api/hit`
(e.g. 30 requests per 10 seconds per IP) to stop scripted inflation of the counts.

## Security and privacy

- Main site is static. Strict CSP (`script-src 'self'`, no inline scripts or styles, no third parties),
  HSTS, `nosniff`, `frame-ancestors 'none'`, locked-down Permissions-Policy: `site/public/_headers`.
- Translations are escaped before rendering; only `**bold**` becomes markup (`src/lib/i18n.ts`).
- Counter accepts only same-origin POSTs, a 64-byte body and a language from the generated allow-list;
  ignores bots, Do Not Track and Global Privacy Control. It stores one row per day and language:
  no cookies, IPs, user agents or identifiers, so no cookie banner is needed.
- Stats page and API are admin-only: Cloudflare Access plus a JWT check in middleware (signature, issuer,
  audience, expiry), failing closed. Responses are `private, no-store` and `noindex`; the API is read-only
  and returns aggregates only.

## License

The code is under the MIT License (`LICENSE`). The MIT License does not cover the images or the exhibition
texts: they belong to their credited owners (the City of Bratislava, the Živé námestie project /
Metropolitan Institute of Bratislava, the Bratislava City Archives and the other photographers named in the
site's photo credits) and are used here to retell the exhibition. Archive material is CC BY-NC-SA 3.0.
Ask the owners before reusing them.
