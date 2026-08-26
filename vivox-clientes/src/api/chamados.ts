import { api } from './client';

export type StatusChamado = 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO';
export type CategoriaChamado = 'BUG' | 'AJUSTE' | 'DUVIDA' | 'ACESSO' | 'OUTRO';
export type UrgenciaChamado = 'BAIXA' | 'MEDIA' | 'ALTA';

export interface Chamado {
  id: string;
  clienteId: string;
  servicoId?: string | null;
  itemPlanejadoId?: string | null;
  itemTitulo?: string | null;
  titulo?: string | null;
  categoria?: CategoriaChamado | null;
  urgencia?: UrgenciaChamado | null;
  anexos: string[];
  slaVencimento?: string | null;
  descricaoProblema: string;
  status: StatusChamado;
  resolvidoEm?: string | null;
  tarefaId?: string | null;
  tarefa?: { id: string; status: string; responsavel?: { id: string; nome: string } | null } | null;
  proprietarioId?: string | null;
  proprietario?: { id: string; nome: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChamadoComentario {
  id: string;
  chamadoId: string;
  autorId?: string | null;
  autor?: { id: string; nome: string; email: string } | null;
  texto: string;
  isSystemMessage: boolean;
  createdAt: string;
}

export interface CreateChamadoPayload {
  clienteId: string;
  servicoId?: string;
  itemPlanejadoId?: string;
  itemTitulo?: string;
  titulo: string;
  categoria: CategoriaChamado;
  urgencia?: UrgenciaChamado;
  descricaoProblema: string;
}

export const chamadosApi = {
  getChamados: async (filtros?: { clienteId?: string; servicoId?: string; status?: StatusChamado }): Promise<Chamado[]> => {
    const response = await api.get<Chamado[]>('/chamados', { params: filtros });
    return response.data;
  },

  createChamado: async (payload: CreateChamadoPayload): Promise<Chamado> => {
    const response = await api.post<Chamado>('/chamados', payload);
    return response.data;
  },

  uploadAnexo: async (chamadoId: string, file: File): Promise<Chamado> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<Chamado>(`/chamados/${chamadoId}/anexos`, formData, {
      headers: { 'Content-Type': undefined }
    });
    return response.data;
  },

  updateChamado: async (id: string, data: { status?: StatusChamado; descricaoProblema?: string; proprietarioId?: string | null }): Promise<Chamado> => {
    const response = await api.patch<Chamado>(`/chamados/${id}`, data);
    return response.data;
  },

  getComentarios: async (chamadoId: string): Promise<ChamadoComentario[]> => {
    const response = await api.get<ChamadoComentario[]>(`/chamados/${chamadoId}/comentarios`);
    return response.data;
  },

  addComentario: async (chamadoId: string, texto: string): Promise<ChamadoComentario> => {
    const response = await api.post<ChamadoComentario>(`/chamados/${chamadoId}/comentarios`, { texto });
    return response.data;
  }
};
