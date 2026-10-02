import { api } from './client';

export type StatusInteresse = 'NOVO' | 'CONTATADO' | 'CONVERTIDO' | 'DESCARTADO';

export interface AcessoPortalResponse {
  login: string;
  senha: string;
  criadoAgora: boolean;
}

export interface ClienteInteresse {
  id: string;
  tipoServico: string;
  label: string;
  status: StatusInteresse;
  mensagem: string | null;
  createdAt: string;
}

export interface ServicoMapaItem {
  tipoServico: string;
  label: string;
  descricao: string;
  contratado: boolean;
  status: string | null;
  dataContratacao: string | null;
  interesseRegistrado: boolean;
}

export interface MapaServicosResponse {
  cliente: {
    id: string;
    nomeFantasia: string;
    logoUrl?: string | null;
  };
  servicos: ServicoMapaItem[];
}

export interface CriarInteressePayload {
  tipoServico: string;
  mensagem?: string;
}

export const portalApi = {
  // Rotas Admin (usuario interno gerenciando acesso e visualizando interesses do cliente)
  getAcessoPortal: async (clienteId: string): Promise<AcessoPortalResponse> => {
    const { data } = await api.post<AcessoPortalResponse>(`/clientes/${clienteId}/acesso-portal`);
    return data;
  },

  redefinirSenhaPortal: async (clienteId: string): Promise<AcessoPortalResponse> => {
    const { data } = await api.post<AcessoPortalResponse>(`/clientes/${clienteId}/acesso-portal/redefinir-senha`);
    return data;
  },

  getInteressesCliente: async (clienteId: string): Promise<ClienteInteresse[]> => {
    const { data } = await api.get<ClienteInteresse[]>(`/clientes/${clienteId}/interesses`);
    return data;
  },

  // Rotas Portal (usuario CLIENTE logado)
  getMapaServicos: async (): Promise<MapaServicosResponse> => {
    const { data } = await api.get<MapaServicosResponse>('/portal/mapa-servicos');
    return data;
  },

  registrarInteresse: async (payload: CriarInteressePayload): Promise<ClienteInteresse> => {
    const { data } = await api.post<ClienteInteresse>('/portal/interesses', payload);
    return data;
  },
};
