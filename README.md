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

Eligible public `REDIRECT` links display images, PDFs, audio, and video in the main viewer. Protected or limited `STREAM` links display a download fallback because the API has no non-consuming preview endpoint. The viewer never spends a limited download merely to show a preview. Native browser codec and PDF support vary.

Login, two-factor verification, refresh, required password change, and logout use the API auth endpoints. Access and refresh tokens live in memory only. Link tokens stay out of page titles, logs, and analytics. The page uses no third-party scripts.

## Deployment requirements

- Serve `404.html` with HTTP 200 for valid `/f/:token` paths, preserving the URL. GitHub Pages alone serves it with HTTP 404; an edge rewrite is required.
- Keep invalid paths at HTTP 404. The root page is a static 404 design, but the host must also return a 404 status for `/` if that status matters to indexing and monitoring.
- Set `Referrer-Policy: no-referrer` and `Cache-Control: no-store` for `/f/*` responses. Bypass edge caching and exclude token-bearing URLs from logs.
- Allow `share.qabas.one` in the API CORS configuration. Expose `Content-Disposition` and `Retry-After` as needed.
- Keep the API as the authority for access and download limits. Never treat previously loaded metadata as permanent access.

The local fonts and visual assets live in `assets/`. There is no build step.
