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
  reposts: number | null;
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
    reposts: number;
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
  ano: number | null; // null quando o período é personalizado
  mes: number | null;
  periodo: { inicio: string; fim: string }; // AAAA-MM-DD, datas inclusivas
  publicacoes: Publicacao[];
  resumo: ResumoAcompanhamento;
}

// Mês (ano + mes) ou período personalizado (inicio + fim), com filtro opcional de tipos
export interface FiltroAcompanhamento {
  ano?: number;
  mes?: number;
  inicio?: string;
  fim?: string;
  tipos?: TipoPublicacao[];
}

const paramsFiltro = ({ tipos, ...resto }: FiltroAcompanhamento) => ({
  ...resto,
  ...(tipos && tipos.length > 0 ? { tipos: tipos.join(',') } : {}),
});

export interface CriarPublicacaoDTO {
  dataPublicacao: string;
  tipo: TipoPublicacao;
  assunto?: string | null;
  link?: string | null;
  curtidas?: number | null;
  comentarios?: number | null;
  compartilhamentos?: number | null;
  salvamentos?: number | null;
  reposts?: number | null;
  visualizacoes?: number | null;
}

export type AtualizarPublicacaoDTO = Partial<CriarPublicacaoDTO>;

export const acompanhamentoApi = {
  // Interno (modulo ACOMPANHAMENTO)
  getAcompanhamento: async (clienteId: string, filtro: FiltroAcompanhamento): Promise<AcompanhamentoResponse> => {
    const { data } = await api.get(`/acompanhamento/clientes/${clienteId}`, {
      params: paramsFiltro(filtro),
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
  getPortalAcompanhamento: async (filtro: FiltroAcompanhamento): Promise<AcompanhamentoResponse> => {
    const { data } = await api.get('/portal/acompanhamento', {
      params: paramsFiltro(filtro),
    });
    return data;
  },

  getPortalMeses: async (): Promise<MesComDados[]> => {
    const { data } = await api.get('/portal/acompanhamento/meses');
    return data;
  },
};
