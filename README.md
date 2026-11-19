# قَبَسْ · File sharing

Arabic, right-to-left HTML/CSS for `share.qabas.one`. The source uses the supplied Qabas monogram and palette, with locally served IBM Plex Sans Arabic and Inter. The included preview shows demo files and recipient states. Live share links require a runtime API integration.

## Preview locally

Run from this directory and open [the recipient preview](http://127.0.0.1:8080/preview/).

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Use the radio controls to preview public links, password entry and validation, sign-in, access denied, an unavailable link, the download limit, rate limiting, a delivery error, a connection error, and inspection in progress. The public example downloads the included Qabas mark. Password fields accept sample input for keyboard and layout review.

| Path | Purpose |
| --- | --- |
| `index.html` | Share-domain home and demo entry point |
| `404.html` | GitHub Pages fallback |
| `preview/index.html` | Recipient UI states with sample data |
| `assets/share.css` | Shared layout, components, and responsive styling |
| `assets/fonts/` | Local web fonts and their SIL Open Font Licenses |

## GitHub Pages

1. Copy the project contents, including `.nojekyll`, to the repository root. In **Settings → Pages**, choose **Deploy from a branch**, select the publishing branch, and choose `/ (root)`.
2. Set the custom domain to `share.qabas.one`. Set the `share` DNS CNAME to `<github-owner>.github.io`, then enable **Enforce HTTPS** after validation. The included `CNAME` identifies the custom domain. Asset URLs are root-relative so the fallback can load them at any depth on that domain.
3. For a live rollout, place an edge proxy in front of Pages. For `share.qabas.one/f/*`, set `Referrer-Policy: no-referrer` and `Cache-Control: no-store` on the HTTP response, and bypass edge caching. With Cloudflare, use a Response Header Transform Rule and a separate Cache Rule. A request for a nonexistent path displays `404.html` with a 404 status on Pages. An edge rewrite to the app shell can serve a 200 for valid-shaped share routes while preserving the browser URL.

The HTML sets the document referrer policy to `no-referrer`. Verify the HTTP headers separately at the edge using a synthetic path. Keep token-bearing paths out of telemetry and logs.

[Pages custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) · [Pages fallback](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site) · [Cloudflare response headers and caching](https://developers.cloudflare.com/rules/transform/response-header-modification/#important-remarks)

## Live integration contract

Use `https://api.qabas.one` as the only API origin. Validate the `/f/:token` path against `^/f/[A-Za-z0-9_-]{32}$` before sending a request. Keep the share token out of titles, sign-in redirect queries, telemetry, and client logs. A sign-in handoff should return an access token through the trusted Qabas authentication flow and resume the share page.

| Operation | Request |
| --- | --- |
| Inspect | `GET /api/v1/f/:token` with `Accept: application/json`. Read the `data` envelope for file name, MIME type, restrictions, expiry, and remaining downloads. `null` means unlimited. |
| Download | `POST /api/v1/f/:token/download`. If the link has a password, send `Content-Type: application/json`, `Accept-Language: ar`, and `{ "password": "…" }`. Otherwise, omit the body or send `{}`. |
| Public `REDIRECT` without a password | Navigate directly to the API `GET /api/v1/f/:token` URL on the user's download action. |
| Authenticated or password-protected `REDIRECT` | Show the delivery error. Create a `STREAM` link for this case. |

Omit `Authorization` for public links. Send the bearer on inspection and download for authenticated links. An inspection `401` starts sign-in, followed by a fresh inspection. For `STREAM`, handle a successful download as a binary `Blob` and use the exposed `Content-Disposition` when naming the file. Check the download response independently of inspection. A download attempt can consume a single-use link, so each attempt must be initiated by the user.

| API response | Recipient state |
| --- | --- |
| `401` | Sign-in required |
| `403` with `fileShares.passwordInvalid` | Inline link password error |
| Other `403` | Account lacks access |
| `404` | Link unavailable |
| `409` with `fileShares.limitReached` | Download limit reached |
| `429` | Rate-limited. Use `Retry-After` when specified. |

Allow `share.qabas.one` in `CORS_ALLOWED_DOMAINS` unless the API already trusts the `qabas.one` parent. Expose `Content-Disposition` and, if present, `Retry-After` to the frontend through CORS. `SHARE_PUBLIC_BASE_URL=https://share.qabas.one` sets the share origin if overriding the API's production default. Creation and management are handled in the signed-in Qabas dashboard.

[Exposing response headers to cross-origin clients](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Expose-Headers)
