import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Verifica o render real, incluindo a fronteira entre HTML comercial e o app.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { modeloEnsino } = await server.ssrLoadModule('/src/features/propostas/modeloEnsino.ts');
  const { documentoHtml, paginaHtml, slidesDaProposta } = await server.ssrLoadModule('/src/features/propostas/documentoHtml.tsx');
  const { normalizarModeloLegado } = await server.ssrLoadModule('/src/features/propostas/modeloLegado.ts');
  const { PropostaDocumento } = await server.ssrLoadModule('/src/features/propostas/PropostaDocumento.tsx');
  const documento = { ...modeloEnsino, destinatario: 'Cliente de exemplo', createdAt: '2026-10-19T14:30:00.000Z', validade: '2026-11-02' };
  const html = documentoHtml(documento);
  assert.match(html, /class="proposta-subcapa-conteudo"/);
  assert.match(html, /class="features"/);
  assert.match(html, /class="comparison"/);
  assert.match(html, /--primary: #91672b/);
  assert.match(html, /grid-template-columns: 1fr 1fr/);
  assert.doesNotMatch(html, /kemax/i);

  const antigo = { ...documento, corDestaque: '#b90679', secoes: documento.secoes.map(({ html: _html, ...secao }) => secao) };
  assert.ok(normalizarModeloLegado(antigo).secoes.every(s => s.html));
  assert.equal(normalizarModeloLegado(antigo).corDestaque, '#91672b');
  const personalizado = { ...antigo, secoes: [{ titulo: 'Meu preço', texto: 'Preço combinado: R$ 42,00' }] };
  assert.equal(normalizarModeloLegado(personalizado).secoes[0].texto, personalizado.secoes[0].texto);
  assert.equal(normalizarModeloLegado(personalizado).secoes[0].html, undefined);

  const tituloMalicioso = documentoHtml({ ...documento, titulo: '<script>parent.alert(1)</script>' });
  assert.ok(!tituloMalicioso.includes('<script>parent.alert(1)</script>'));
  assert.match(paginaHtml('', 'url(https://exemplo.invalid)'), /--primary: #91672b/);
  const frame = renderToStaticMarkup(React.createElement(PropostaDocumento, { documento: {
    ...documento, secoes: [{ titulo: 'Conteúdo', texto: '', html: '<script>parent.alert(1)</script><img src="https://exemplo.invalid">' }],
  } }));
  assert.match(frame, /<iframe/);
  assert.match(frame, /sandbox="allow-same-origin"/);
  assert.doesNotMatch(frame, /allow-scripts/);
  assert.match(frame, /script-src &#x27;none&#x27;/);
  assert.match(frame, /default-src &#x27;none&#x27;/);
  assert.match(frame, /Informações da proposta/);
  assert.match(frame, /19\/10\/2026/);
  assert.match(frame, /02\/11\/2026/);
  assert.match(frame, /Baixar proposta/);
  const slides = slidesDaProposta(documento);
  assert.equal(slides.length, documento.secoes.length + 3);
  assert.equal(slides[0].titulo, 'Capa');
  assert.equal(slides.at(-1).titulo, 'Encerramento');
  assert.ok(documento.secoes.every(s => slides.some(slide => slide.titulo === s.titulo)));

  if (process.argv[2]) await writeFile(process.argv[2], html);
  console.log('Propostas: CSS e estrutura originais, compatibilidade com textos antigos e isolamento do HTML passaram.');
} finally { await server.close(); }
