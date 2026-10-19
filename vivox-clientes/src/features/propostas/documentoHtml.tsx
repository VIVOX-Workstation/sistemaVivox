import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import referenciaCss from './referencia.css?raw';
import type { DocumentoProposta, SecaoProposta } from './types';
import { corDaProposta, normalizarModeloLegado } from './modeloLegado';
import capaProposta from '../../assets/capaProposta.webp?inline';
import subCapa from '../../assets/subCapa.webp?inline';
import propostaFinal from '../../assets/propostaFinal.webp?inline';

export const escapar = (texto: string) => texto.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// HTML comercial é conteúdo, nunca código executável. CSP e sandbox são
// obrigatórios, inclusive na edição; nenhuma origem externa pode ser carregada.
export function paginaHtml(conteudo: string, cor: string, extraCss = '') {
  const destaque = corDaProposta(cor);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none';"><meta name="referrer" content="no-referrer"><style>${referenciaCss}\n:root { --primary: ${destaque}; }\n${extraCss}</style></head><body>${conteudo}</body></html>`;
}

export function conteudoSecao(secao: SecaoProposta, editando = false) {
  if (secao.html !== undefined) {
    // Navegador: só a estrutura comercial, sem scripts, eventos, URLs, meta,
    // estilos arbitrários, formulários ou conteúdo incorporado. No render
    // estático de verificação, o iframe ainda mantém sandbox e CSP restritos.
    const html = typeof DOMPurify.sanitize === 'function' ? DOMPurify.sanitize(secao.html, {
      ALLOWED_TAGS: ['div', 'span', 'p', 'strong', 'b', 'em', 'i', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'article', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'br', 'blockquote', 'hr'],
      ALLOWED_ATTR: ['class', 'colspan', 'rowspan', 'scope'],
      ALLOW_DATA_ATTR: false,
    }) : secao.html;
    const titulo = `<h2${editando ? ' contenteditable="false"' : ''}>${escapar(secao.titulo)}</h2>`;
    return /<h2\b/i.test(html) ? html.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/i, titulo) : titulo + html;
  }
  return `<div class="section-header"><h2${editando ? ' contenteditable="false"' : ''}>${escapar(secao.titulo)}</h2></div><div class="markdown">${renderToStaticMarkup(
    <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml disallowedElements={['img']} unwrapDisallowed>{secao.texto}</ReactMarkdown>,
  )}</div>`;
}

export interface SlideProposta { titulo: string; conteudo: string }

export function slidesDaProposta(documento: DocumentoProposta): SlideProposta[] {
  documento = normalizarModeloLegado(documento);
  // Assets empacotados como data URI: funcionam no srcDoc sem liberar imagens
  // externas na CSP e não dependem de URLs relativas no link compartilhado.
  const capa = `<div class="proposta-imagem-pagina proposta-capa-identificada" data-proposta-pagina="capa">
      <img src="${escapar(capaProposta)}" alt="Capa da proposta comercial VIVOX" width="1920" height="1080">
      <div class="proposta-capa-legenda"><p>${escapar(documento.destinatario)}</p><h2><span>Proposta Comercial</span><span>2026</span></h2></div>
    </div>`;
  const subcapa = `<section class="proposta-imagem-pagina proposta-subcapa" data-proposta-pagina="subcapa">
      <img src="${escapar(subCapa)}" alt="Apresentação VIVOX: estratégia e resultados" width="1928" height="1088">
      <header class="proposta-subcapa-conteudo">
        <p class="proposta-subcapa-rotulo">Proposta comercial</p>
        <h1>${escapar(documento.titulo)}</h1>
        <p class="proposta-subcapa-descricao">${escapar(documento.apresentacao).replace(/\n/g, '<br>')}</p>
        ${documento.validade ? `<p class="proposta-subcapa-validade">Válida até ${escapar(documento.validade.slice(0, 10).split('-').reverse().join('/'))}</p>` : ''}
      </header>
    </section>`;
  const encerramento = `<div class="proposta-imagem-pagina" data-proposta-pagina="encerramento"><img src="${escapar(propostaFinal)}" alt="Vamos começar hoje mesmo? VIVOX — Marcas fortes não falam só de vez em quando, elas têm voz ativa o ano inteiro." width="1928" height="1088"></div>
  `;
  return [
    { titulo: 'Capa', conteudo: capa },
    { titulo: 'Apresentação', conteudo: subcapa },
    ...documento.secoes.map((s, i) => ({ titulo: s.titulo, conteudo: `<section class="section" id="secao-${i}">${conteudoSecao(s)}</section>` })),
    { titulo: 'Encerramento', conteudo: encerramento },
  ];
}

export function htmlDoSlide(slide: SlideProposta, cor: string, cssExtra = '') {
  return paginaHtml(`<main class="document">${slide.conteudo}</main>`, cor,
    `body{margin:0;background:transparent}.document{margin:0 auto;box-shadow:none} ${cssExtra}`);
}

export function documentoHtml(documento: DocumentoProposta) {
  return paginaHtml(`<main class="document">${slidesDaProposta(documento).map(s => s.conteudo).join('')}</main>`, documento.corDestaque,
    'html,body{overflow:hidden}.document{margin:0 auto;box-shadow:none}');
}
