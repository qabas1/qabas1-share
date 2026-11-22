import test from 'node:test';
import assert from 'node:assert/strict';
import route from '../edge/share-route.mjs';

test('valid links use the static shell without exposing the token upstream', async () => {
  const originalFetch = globalThis.fetch;
  const upstreamPaths = [];
  globalThis.fetch = async url => {
    upstreamPaths.push(new URL(url).pathname);
    return new Response('<h1>shell</h1>', {
      headers: { 'Content-Type': 'text/html', ETag: 'old-value' }
    });
  };
  try {
    const token = 'A'.repeat(32);
    const response = await route.fetch(new Request(`https://share.qabas.one/f/${token}`));
    assert.equal(response.status, 200);
    assert.equal(await response.text(), '<h1>shell</h1>');
    assert.deepEqual(upstreamPaths, ['/404.html']);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
    assert.equal(response.headers.get('ETag'), null);

    const relayToken = 'B'.repeat(43);
    const relay = await route.fetch(new Request(`https://share.qabas.one/r/${relayToken}`));
    assert.equal(relay.status, 200);
    assert.deepEqual(upstreamPaths, ['/404.html', '/relay.html']);
    assert.equal(relay.headers.get('Referrer-Policy'), 'no-referrer');
    assert.equal(relay.headers.get('Cache-Control'), 'no-store');

    const badRelay = await route.fetch(new Request('https://share.qabas.one/r/invalid'));
    assert.equal(badRelay.status, 404);

    const invalid = await route.fetch(new Request('https://share.qabas.one/f/invalid'));
    assert.equal(invalid.status, 404);
    const demo = await route.fetch(new Request('https://share.qabas.one/__demo/'));
    assert.equal(demo.status, 404);
    assert.deepEqual(upstreamPaths.slice(-1), ['/404.html']);
    const post = await route.fetch(new Request(`https://share.qabas.one/f/${token}`, { method: 'POST' }));
    assert.equal(post.status, 405);
    assert.equal(post.headers.get('Cache-Control'), 'no-store');
    globalThis.fetch = async () => { throw new Error('origin unavailable'); };
    const unavailable = await route.fetch(new Request(`https://share.qabas.one/f/${token}`));
    assert.equal(unavailable.status, 502);
    assert.equal(unavailable.headers.get('Referrer-Policy'), 'no-referrer');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
