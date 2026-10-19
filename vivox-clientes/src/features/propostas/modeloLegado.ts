import { modeloEnsino } from './modeloEnsino';
import type { DocumentoProposta } from './types';

// O magenta era o padrão do arquivo de exemplo; propostas já salvas também
// passam a usar o dourado da VIVOX, sem alterar seus textos ou dados comerciais.
export function corDaProposta(cor: string): string {
  return /^#[a-f\d]{6}$/i.test(cor) && cor.toLowerCase() !== '#b90679' ? cor : '#91672b';
}

// Recupera a estrutura do arquivo de referência apenas quando o texto antigo
// ainda é idêntico ao modelo. Conteúdo personalizado nunca é sobrescrito.
export function normalizarModeloLegado(documento: DocumentoProposta): DocumentoProposta {
  const secoes = documento.secoes.map(secao => {
    if (secao.html !== undefined) return secao;
    const original = modeloEnsino.secoes.find(s => s.texto === secao.texto);
    if (!original) return secao;
    return { ...secao, html: original.html };
  });
  return {
    ...documento, secoes,
    corDestaque: corDaProposta(documento.corDestaque),
  };
}
