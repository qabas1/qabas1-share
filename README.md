# قَبَسْ · File sharing recipient

Small Arabic, right-to-left frontend for managed file links.

## Routes and screens

| URL | Screen |
| --- | --- |
| `/f/:token` | File content, metadata, and download. A valid token has exactly 32 URL-safe characters. |
| `/f/:token` with an API error | Focused error state with the available next step. |
| Any other path | 404. `/` has a static 404 page; `404.html` renders 404 for invalid paths. |

Protected links open a native modal for login, two-factor verification, or a required account password change. A link password is a separate field on the file page. No page has a navigation header. The `/preview/` demo route has been removed.

## API

The browser calls `https://api.qabas.one` only. It inspects a link with `GET /api/v1/f/:token` and `Accept: application/json`, then downloads with `POST /api/v1/f/:token/download`. For a public, password-free `REDIRECT` link, download navigates to the API URL. `STREAM` responses become a `Blob` and use `Content-Disposition` for the filename.

Eligible public `REDIRECT` links display images, audio, and video in the main viewer. PDFs open in the browser's own viewer in a new tab because the private storage origin blocks embedding in a frame. Protected or limited `STREAM` links display a download fallback because the API has no non-consuming preview endpoint. The viewer never spends a limited download merely to show a preview. Native browser codec and PDF support vary.

Login, two-factor verification, refresh, required password change, and logout use the API auth endpoints. Access and refresh tokens live in memory only. Link tokens stay out of page titles, logs, and analytics. The page uses no third-party scripts.

## Deployment requirements

- In repository **Settings → Pages → Build and deployment**, select **GitHub Actions**. `.github/workflows/pages.yml` publishes the static files on every push to `main`. Keep `share.qabas.one` configured as the Pages custom domain and keep its DNS record proxied through Cloudflare.
- Deploy `edge/share-route.mjs` with `npx wrangler@latest deploy` after authenticating Wrangler to the Cloudflare account for `qabas.one`. Its route is configured in `wrangler.jsonc` as `share.qabas.one/f/*`. It serves the GitHub Pages shell with HTTP 200 for valid link paths, preserves the URL, and returns 404 for invalid link paths. GitHub Pages alone returns HTTP 404 for a valid dynamic path.
- The Worker sets `Referrer-Policy: no-referrer` and `Cache-Control: no-store` for `/f/*`. Bypass Cloudflare caching for that path and exclude token-bearing URLs from access logs. The root page is a static 404 design, but Pages returns HTTP 200 for `/`.
- Allow `share.qabas.one` in the API CORS configuration. Expose `Content-Disposition` and `Retry-After` as needed.
- Keep the API as the authority for access and download limits. Never treat previously loaded metadata as permanent access.

If a valid 32-character `/f/:token` URL still returns HTTP 404 while its file view appears, GitHub Pages is serving `404.html` directly and the Cloudflare Worker route is not active. Confirm the Worker is deployed and attached to `share.qabas.one/f/*` under **Settings → Domains & Routes**. Do not add Google Fonts to the page CSP to fix PDF iframe errors; the storage origin refuses framing, so PDFs open in a new tab instead.

The local fonts and visual assets live in `assets/`. There is no build step.
