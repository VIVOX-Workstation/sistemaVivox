import assert from 'node:assert/strict';

// Executar contra o build servido por Nginx (não contra o Vite).
const origem = process.argv[2] || 'http://localhost:5188';
const token = 'a'.repeat(64);
for (const sufixo of ['', '/', '?origem=teste']) {
  const resposta = await fetch(`${origem}/proposta/${token}${sufixo}`, {
    headers: { 'User-Agent': 'facebookexternalhit/1.1', 'X-Forwarded-Proto': 'https' },
  });
  assert.equal(resposta.status, 200);
  assert.equal(resposta.headers.get('cache-control'), 'no-store');
  const html = await resposta.text();
  assert.match(html, /<title>Proposta comercial \| VIVOX<\/title>/);
  assert.match(html, /property="og:type" content="website"/);
  assert.match(html, /property="og:url" content="https:\/\//);
  assert.match(html, /property="og:image" content="https:\/\/[^"<>]+\/proposta-capa\.jpg"/);
  assert.match(html, /property="og:image:type" content="image\/jpeg"/);
  assert.match(html, /<script type="module"[^>]*src="\/assets\//);
}
const capa = await fetch(`${origem}/proposta-capa.jpg`);
assert.equal(capa.status, 200);
assert.equal(capa.headers.get('content-type'), 'image/jpeg');
const bytes = new Uint8Array(await capa.arrayBuffer());
assert.deepEqual(Array.from(bytes.slice(0, 3)), [0xff, 0xd8, 0xff]);
const home = await fetch(origem);
assert.doesNotMatch(await home.text(), /property="og:image"/);
console.log('Nginx: metadados no HTML inicial, URL HTTPS, capa JPEG acessível e rotas da SPA passaram.');
