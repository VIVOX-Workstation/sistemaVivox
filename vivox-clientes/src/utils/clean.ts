import type { TipoServico } from '../types';

// Rótulos e helpers compartilhados pelas telas no layout clean.

export const STATUS_CLIENTE: Record<string, [string, string]> = {
  ATIVO: ['Ativo', 'bd ok'],
  PROSPECT: ['Prospect', 'bd info'],
  PAUSADO: ['Pausado', 'bd warn'],
  ENCERRADO: ['Encerrado', 'bd'],
};

export function sigla(nome: string) {
  const p = nome.trim().split(/\s+/).filter((w) => w.length > 2);
  const base = p.length ? p : [nome];
  return ((base[0]?.[0] ?? '?') + (base[1]?.[0] ?? '')).toUpperCase();
}

export const TODOS_SERVICOS: { tipo: TipoServico; nome: string; descricao: string }[] = [
  { tipo: 'GERENCIAMENTO_REDES', nome: 'Gestão de redes sociais', descricao: 'Planejamento, criação e postagens.' },
  { tipo: 'TRAFEGO_PAGO', nome: 'Tráfego pago', descricao: 'Campanhas no Meta e no Google.' },
  { tipo: 'LANDING_PAGE', nome: 'Landing page', descricao: 'Páginas focadas em conversão.' },
  { tipo: 'APP', nome: 'App', descricao: 'Aplicativo sob medida.' },
  { tipo: 'IDENTIDADE_VISUAL', nome: 'Identidade visual', descricao: 'Logo, paleta e manual da marca.' },
  { tipo: 'FOTOGRAFIA', nome: 'Fotografia', descricao: 'Fotos de produtos, equipe e espaço.' },
  { tipo: 'VIDEO', nome: 'Produção de vídeo', descricao: 'Captação e edição.' },
  { tipo: 'FOLDER', nome: 'Folder', descricao: 'Materiais impressos e promocionais.' },
  { tipo: 'REVISTA', nome: 'Revista', descricao: 'Projeto editorial e diagramação.' },
];

export const nomeServico = (tipo?: string) => {
  const n = TODOS_SERVICOS.find((t) => t.tipo === tipo)?.nome ?? (tipo || '').replace(/_/g, ' ').toLowerCase();
  return n.charAt(0).toUpperCase() + n.slice(1);
};
