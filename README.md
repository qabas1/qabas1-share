# قَبَسْ · File sharing recipient

Small Arabic, right-to-left frontend for managed file links.

## Routes and screens

| URL | Screen |
| --- | --- |
| `/f/:token` | File content, metadata, and download. A valid token has exactly 32 URL-safe characters. |
| `/r/:token` | Relay request form and evidence upload. A valid token has exactly 43 URL-safe characters. |
| `/__demo/` | Local-only Relay form preview with sample data. |
| `/f/:token` with an API error | Focused error state with the available next step. |
| Any other path | 404. `/` has a static 404 page; `404.html` renders 404 for invalid paths. |

Protected links open a native modal for login, two-factor verification, or a required account password change. A link password is a separate field on the file page. No page has a navigation header. The `/preview/` demo route has been removed.

## Local form demo

Run `python -m http.server 8000` from the repository root and open `http://localhost:8000/__demo/` to preview the Relay form with sample data. The demo uses the production renderer and simulates uploads and submission locally; it does not contact the API. The `__demo/` page is intentionally omitted from the GitHub Pages artifact and production container.

## API

The browser calls `https://api.qabas.one` only. It inspects a link with `GET /api/v1/f/:token` and `Accept: application/json`, then downloads with `POST /api/v1/f/:token/download`. For a public, password-free `REDIRECT` link, download navigates to the API URL. `STREAM` responses become a `Blob` and use `Content-Disposition` for the filename.

Eligible public `REDIRECT` links display images, audio, and video in the main viewer. PDFs open in the browser's own viewer in a new tab because the private storage origin blocks embedding in a frame. Password-protected links show an access screen before any file UI. Entering the correct password calls the API download endpoint, consumes one download slot, and opens the returned `Blob` for preview and saving without a second API request. Other limited `STREAM` links display a download fallback because the API has no non-consuming preview endpoint. Native browser codec and PDF support vary.

The frontend gate hides file details in the page, but `GET /api/v1/f/:token` currently returns metadata for password-protected public links. If the filename and metadata must also remain secret until password verification, the API needs a non-consuming verification flow or must suppress that metadata before verification. The static frontend cannot enforce that boundary by itself.

Login, two-factor verification, refresh, required password change, and logout use the API auth endpoints. Access and refresh tokens live in memory only. Link tokens stay out of page titles, logs, and analytics. The page uses no third-party scripts.

## Deployment requirements

- In repository **Settings → Pages → Build and deployment**, select **GitHub Actions**. `.github/workflows/pages.yml` publishes the static files on every push to `main`. Keep `share.qabas.one` configured as the Pages custom domain and keep its DNS record proxied through Cloudflare.
- The Relay page uses the public `/api/v1/r/:token` contract. Each file gets one upload session, raw-byte completion, and evidence status polling. The receipt confirms submission only; the public API has no final submission-status endpoint. A later clarification opens as a separate `/r/:token` link and schema.
- The Worker also serves `relay.html` with HTTP 200 for valid `/r/:token` paths. Deploy the updated Worker route for both `/f/*` and `/r/*`; GitHub Pages alone returns 404 on direct dynamic paths. The nginx container also routes `/r/:token` to `relay.html`.
- Deploy `edge/share-route.mjs` with `npx wrangler@latest deploy` after authenticating Wrangler to the Cloudflare account for `qabas.one`. Its route is configured in `wrangler.jsonc` as `share.qabas.one/f/*`. It serves the GitHub Pages shell with HTTP 200 for valid link paths, preserves the URL, and returns 404 for invalid link paths. GitHub Pages alone returns HTTP 404 for a valid dynamic path.
- The Worker sets `Referrer-Policy: no-referrer` and `Cache-Control: no-store` for `/f/*`. Bypass Cloudflare caching for that path and exclude token-bearing URLs from access logs. The root page is a static 404 design, but Pages returns HTTP 200 for `/`.
- Allow `share.qabas.one` in the API CORS configuration. Expose `Content-Disposition` and `Retry-After` as needed.
- Keep the API as the authority for access and download limits. Never treat previously loaded metadata as permanent access.

If a valid 32-character `/f/:token` URL still returns HTTP 404 while its file view appears, GitHub Pages is serving `404.html` directly and the Cloudflare Worker route is not active. Confirm the Worker is deployed and attached to `share.qabas.one/f/*` under **Settings → Domains & Routes**. Do not add Google Fonts to the page CSP to fix PDF iframe errors; the storage origin refuses framing, so PDFs open in a new tab instead.

The local fonts and visual assets live in `assets/`. There is no build step.

- The container.yml workflow builds and publishes ghcr.io/<owner>/qabas1-share on pushes to main and dev, tagged with the branch name and commit SHA. The image serves the static site on port 8080 (docker run -p 8080:8080 ...).

- The container reads API_BASE_URL at startup (default: https://api.qabas.one). Copy .env.example to .env, set API_BASE_URL, then run with docker run --env-file .env -p 8080:8080 ghcr.io/<owner>/qabas1-share:dev. The value is an API origin; /api/v1 is added by the page.
