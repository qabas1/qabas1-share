const FILE_PATH = /^\/f\/[A-Za-z0-9_-]{32}\/?$/;
const RELAY_PATH = /^\/r\/[A-Za-z0-9_-]{43}\/?$/;

export default {
  async fetch(request) {
    const privateHeaders = {
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff'
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { ...privateHeaders, Allow: 'GET, HEAD' } });
    }
    const url = new URL(request.url);
    const relay = RELAY_PATH.test(url.pathname);
    const valid = FILE_PATH.test(url.pathname) || relay;
    const shellUrl = new URL(relay ? '/relay.html' : '/404.html', url.origin);
    let upstream;
    try {
      upstream = await fetch(shellUrl, {
        headers: { Accept: 'text/html' },
        cf: { cacheTtl: 0 }
      });
    } catch {
      return new Response('Share page unavailable', { status: 502, headers: privateHeaders });
    }
    if (!upstream.ok) return new Response('Share page unavailable', { status: 502, headers: privateHeaders });

    const headers = new Headers(upstream.headers);
    for (const [name, value] of Object.entries(privateHeaders)) headers.set(name, value);
    headers.delete('ETag');
    headers.delete('Last-Modified');
    if (request.method === 'HEAD') headers.delete('Content-Length');
    return new Response(request.method === 'HEAD' ? null : upstream.body, {
      status: valid ? 200 : 404,
      headers
    });
  }
};
