import { api } from './client';

export type TipoPublicacao = 'POST' | 'REELS' | 'CARROSSEL' | 'STORY' | 'VIDEO';

export interface Publicacao {
  id: string;
  dataPublicacao: string; // ISO
  tipo: TipoPublicacao;
  assunto: string | null;
  link: string | null;
  curtidas: number | null;
  comentarios: number | null;
  compartilhamentos: number | null; // (= Envios)
  salvamentos: number | null;
  visualizacoes: number | null;
  alcance?: number | null;
  origemDado?: string;
  clienteId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MesComDados {
  ano: number;
  mes: number;
  total: number;
}

export interface ResumoAcompanhamento {
  total: number;
  porTipo: {
    POST: number;
    REELS: number;
    CARROSSEL: number;
    STORY: number;
    VIDEO: number;
  };
  totais: {
    curtidas: number;
    comentarios: number;
    compartilhamentos: number;
    salvamentos: number;
    visualizacoes: number;
  };
}

export interface AcompanhamentoCliente {
  id: string;
  nomeFantasia: string;
  logoUrl?: string | null;
}

export interface AcompanhamentoResponse {
  cliente: AcompanhamentoCliente;
  ano: number;
  mes: number;
  publicacoes: Publicacao[];
  resumo: ResumoAcompanhamento;
}

export interface CriarPublicacaoDTO {
  dataPublicacao: string;
  tipo: TipoPublicacao;
  assunto?: string | null;
  link?: string | null;
  curtidas?: number | null;
  comentarios?: number | null;
  compartilhamentos?: number | null;
  salvamentos?: number | null;
  visualizacoes?: number | null;
}

export type AtualizarPublicacaoDTO = Partial<CriarPublicacaoDTO>;

export const acompanhamentoApi = {
  // Interno (modulo ACOMPANHAMENTO)
  getAcompanhamento: async (clienteId: string, ano: number, mes: number): Promise<AcompanhamentoResponse> => {
    const { data } = await api.get(`/acompanhamento/clientes/${clienteId}`, {
      params: { ano, mes },
    });
    return data;
  },

  getMesesComDados: async (clienteId: string): Promise<MesComDados[]> => {
    const { data } = await api.get(`/acompanhamento/clientes/${clienteId}/meses`);
    return data;
  },

  criarPublicacao: async (clienteId: string, payload: CriarPublicacaoDTO): Promise<Publicacao> => {
    const { data } = await api.post(`/acompanhamento/clientes/${clienteId}/publicacoes`, payload);
    return data;
  },

  atualizarPublicacao: async (id: string, payload: AtualizarPublicacaoDTO): Promise<Publicacao> => {
    const { data } = await api.patch(`/acompanhamento/publicacoes/${id}`, payload);
    return data;
  },

  excluirPublicacao: async (id: string): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(`/acompanhamento/publicacoes/${id}`);
    return data;
  },

  getClientes: async (): Promise<AcompanhamentoCliente[]> => {
    const { data } = await api.get('/clientes');
    return data;
  },

  // Portal (Cliente logado, somente leitura)
  getPortalAcompanhamento: async (ano?: number, mes?: number): Promise<AcompanhamentoResponse> => {
    const { data } = await api.get('/portal/acompanhamento', {
      params: { ano, mes },
    });
    return data;
  },

  getPortalMeses: async (): Promise<MesComDados[]> => {
    const { data } = await api.get('/portal/acompanhamento/meses');
    return data;
  },
};
