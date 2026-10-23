import { conteudoSecao } from './documentoHtml';
import type { SecaoProposta } from './types';

// Lê o HTML já sanitizado da seção (as classes do modelo de referência) e o
// transforma em blocos para a landing. O que não for reconhecido vira "html",
// renderizado como está: a landing nunca esconde conteúdo editado pela equipe.

export interface Cartao { numero: string; titulo: string; itens: string[] }
export interface Passo { numero: string; titulo: string; texto: string }
export interface Numero { valor: string; rotulo: string }
export interface ValorOpcao { rotulo: string; valor: string; dica: string; suave: boolean }
export interface Preco { rotulo: string; titulo: string; valor: string; texto: string; destaque: boolean }
export interface CelulaTabela { texto: string; tipo: 'sim' | 'nao' | 'texto' }

export type Bloco =
  | { tipo: 'faixa'; id: string; selo: string }
  | { tipo: 'cabecalho'; rotulo: string; linhas: string[]; texto: string }
  | { tipo: 'destaque'; titulo: string; html: string }
  | { tipo: 'rotulo'; texto: string }
  | { tipo: 'cartoes'; cartoes: Cartao[] }
  | { tipo: 'numeros'; numeros: Numero[] }
  | { tipo: 'passos'; passos: Passo[] }
  | { tipo: 'nota'; icone: string; html: string }
  | { tipo: 'valores'; valores: ValorOpcao[] }
  | { tipo: 'tabela'; cabecalho: string[]; linhas: CelulaTabela[][] }
  | { tipo: 'precos'; precos: Preco[] }
  | { tipo: 'condicoes'; titulo: string; paragrafos: string[] }
  | { tipo: 'html'; html: string };

export interface SecaoLanding { titulo: string; blocos: Bloco[] }

const texto = (el: Element | null | undefined) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
const filho = (el: Element, seletor: string) => el.querySelector(`:scope ${seletor}`);

function linhasDoTitulo(h2: Element | null, fallback: string): string[] {
  if (!h2) return [fallback];
  const partes = h2.innerHTML.split(/<br\s*\/?>/i).map(p => {
    const tmp = document.createElement('div');
    tmp.innerHTML = p;
    return texto(tmp);
  }).filter(Boolean);
  return partes.length ? partes : [fallback];
}

function blocoDe(el: Element, titulo: string): Bloco | Bloco[] | null {
  const c = el.classList;
  if (c.contains('option-banner')) return { tipo: 'faixa', id: texto(filho(el, '.option-id')), selo: texto(filho(el, '.option-badge')) };
  if (c.contains('section-header')) {
    return { tipo: 'cabecalho', rotulo: texto(filho(el, '.eyebrow')), linhas: linhasDoTitulo(filho(el, 'h2'), titulo), texto: texto(filho(el, 'p')) };
  }
  if (c.contains('highlight')) {
    const strong = el.querySelector(':scope > strong');
    const p = el.querySelector(':scope > p');
    return { tipo: 'destaque', titulo: texto(strong), html: p?.innerHTML ?? '' };
  }
  if (c.contains('split-label')) return { tipo: 'rotulo', texto: texto(el) };
  if (c.contains('features')) {
    return {
      tipo: 'cartoes',
      cartoes: [...el.querySelectorAll(':scope > .feature')].map(f => ({
        numero: texto(f.querySelector('.feature-icon')),
        titulo: texto(f.querySelector('h3')),
        itens: [...f.querySelectorAll('li')].map(li => texto(li)).filter(Boolean),
      })),
    };
  }
  if (c.contains('overview-stats')) {
    return { tipo: 'numeros', numeros: [...el.querySelectorAll(':scope > .stat')].map(s => ({ valor: texto(s.querySelector('.num')), rotulo: texto(s.querySelector('p')) })) };
  }
  if (c.contains('steps')) {
    return {
      tipo: 'passos',
      passos: [...el.querySelectorAll(':scope > .step')].map(s => ({ numero: texto(s.querySelector('.num')), titulo: texto(s.querySelector('h4')), texto: texto(s.querySelector('p')) })),
    };
  }
  if (c.contains('note')) return { tipo: 'nota', icone: texto(filho(el, '.note-icon')) || 'i', html: el.querySelector(':scope > p')?.innerHTML ?? '' };
  if (c.contains('option-footer')) {
    return {
      tipo: 'valores',
      valores: [...el.querySelectorAll(':scope > .option-value')].map(v => ({
        rotulo: texto(v.querySelector('.label')), valor: texto(v.querySelector('.value')), dica: texto(v.querySelector('.hint')), suave: v.classList.contains('soft'),
      })),
    };
  }
  const tabela = c.contains('table-scroll') ? el.querySelector('table') : el.tagName === 'TABLE' ? el : null;
  if (tabela) {
    return {
      tipo: 'tabela',
      cabecalho: [...tabela.querySelectorAll('thead th')].map(th => texto(th)),
      linhas: [...tabela.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => ({
        texto: texto(td),
        tipo: td.querySelector('.yes') ? 'sim' as const : td.querySelector('.no') ? 'nao' as const : 'texto' as const,
      }))),
    };
  }
  if (c.contains('pricing')) {
    return {
      tipo: 'precos',
      precos: [...el.querySelectorAll(':scope > .pricing-card')].map(p => ({
        rotulo: texto(p.querySelector('.eyebrow')), titulo: texto(p.querySelector('h3')), valor: texto(p.querySelector('.price')),
        texto: texto(p.querySelector('p')), destaque: p.classList.contains('best'),
      })),
    };
  }
  if (c.contains('terms')) {
    return { tipo: 'condicoes', titulo: texto(el.querySelector('h3')), paragrafos: [...el.querySelectorAll('p')].map(p => p.innerHTML) };
  }
  return null;
}

export function secaoParaLanding(secao: SecaoProposta): SecaoLanding {
  const raiz = document.createElement('div');
  raiz.innerHTML = conteudoSecao(secao);
  const blocos: Bloco[] = [];
  let solto = '';
  const soltar = () => { if (solto.trim()) blocos.push({ tipo: 'html', html: solto }); solto = ''; };
  for (const el of [...raiz.children]) {
    const bloco = blocoDe(el, secao.titulo);
    if (!bloco) { solto += el.outerHTML; continue; }
    soltar();
    blocos.push(...(Array.isArray(bloco) ? bloco : [bloco]));
  }
  soltar();
  if (!blocos.some(b => b.tipo === 'cabecalho')) blocos.unshift({ tipo: 'cabecalho', rotulo: '', linhas: [secao.titulo], texto: '' });
  return { titulo: secao.titulo, blocos };
}
