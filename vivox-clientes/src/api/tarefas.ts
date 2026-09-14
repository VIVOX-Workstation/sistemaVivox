import { api } from './client';
import type { Tarefa, MetricasTarefas, StatusTarefa, PrioridadeTarefa } from '../types';

export interface TarefaFiltros {
  search?: string;
  status?: StatusTarefa;
  prioridade?: PrioridadeTarefa;
  responsavelId?: string;
  clienteId?: string;
  projetoId?: string;
  servicoId?: string;
}

export interface CreateTarefaPayload {
  titulo: string;
  descricao?: string;
  status?: StatusTarefa;
  prioridade?: PrioridadeTarefa;
  prazo?: string | null;
  dataInicio?: string;
  horasEstimadas?: number;
  horasGastas?: number;
  tags?: string[];
  responsavelId?: string;
  clienteId?: string;
  projetoId?: string;
  servicoId?: string;
  checklist?: string[];
}

export interface UpdateTarefaPayload extends Partial<CreateTarefaPayload> {
  dataConclusao?: string;
  ordem?: number;
}

export interface ColunaFiltros {
  status: string;
  projetoId?: string;
  search?: string;
  prioridade?: PrioridadeTarefa;
  responsavelId?: string;
  clienteId?: string;
  servicoId?: string;
  skip?: number;
  take?: number;
}

export interface ColunaResultado {
  items: Tarefa[];
  total: number;
}

export interface ResumoEtapasFiltros {
  projetoId?: string;
  search?: string;
  prioridade?: PrioridadeTarefa;
  responsavelId?: string;
  clienteId?: string;
  servicoId?: string;
}

export interface ResumoEtapas {
  contadoresPorEtapa: Record<string, number>;
  total: number;
  emAndamento: number;
  concluidas: number;
  urgentes: number;
}

export const tarefasApi = {
  getTarefas: async (filtros?: TarefaFiltros): Promise<Tarefa[]> => {
    const response = await api.get<Tarefa[]>('/tarefas', { params: filtros });
    return response.data;
  },

  // Busca paginada de uma única etapa/coluna do Kanban, usada para carregar
  // cada coluna sob demanda em vez de trazer o workspace inteiro de uma vez.
  getColuna: async (filtros: ColunaFiltros): Promise<ColunaResultado> => {
    const response = await api.get<ColunaResultado>('/tarefas/coluna', { params: filtros });
    return response.data;
  },

  getResumoEtapas: async (filtros?: ResumoEtapasFiltros): Promise<ResumoEtapas> => {
    const response = await api.get<ResumoEtapas>('/tarefas/resumo-etapas', { params: filtros });
    return response.data;
  },

  moverEtapa: async (statusOrigem: string, statusDestino: string, projetoId?: string): Promise<{ movidas: number }> => {
    const response = await api.patch('/tarefas/mover-etapa', { statusOrigem, statusDestino, projetoId });
    return response.data;
  },

  getMetricas: async (): Promise<MetricasTarefas> => {
    const response = await api.get<MetricasTarefas>('/tarefas/metricas');
    return response.data;
  },

  getTarefaById: async (id: string): Promise<Tarefa> => {
    const response = await api.get<Tarefa>(`/tarefas/${id}`);
    return response.data;
  },

  createTarefa: async (payload: CreateTarefaPayload): Promise<Tarefa> => {
    const response = await api.post<Tarefa>('/tarefas', payload);
    return response.data;
  },

  updateTarefa: async (id: string, payload: UpdateTarefaPayload): Promise<Tarefa> => {
    const response = await api.patch<Tarefa>(`/tarefas/${id}`, payload);
    return response.data;
  },

  deleteTarefa: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/tarefas/${id}`);
    return response.data;
  },

  addChecklistItem: async (tarefaId: string, titulo: string): Promise<any> => {
    const response = await api.post(`/tarefas/${tarefaId}/checklist`, { titulo });
    return response.data;
  },

  updateChecklistItem: async (itemId: string, data: { concluido?: boolean; titulo?: string }): Promise<any> => {
    const response = await api.patch(`/tarefas/checklist/${itemId}`, data);
    return response.data;
  },

  removeChecklistItem: async (itemId: string): Promise<any> => {
    const response = await api.delete(`/tarefas/checklist/${itemId}`);
    return response.data;
  },

  addComentario: async (tarefaId: string, texto: string, sistema?: boolean): Promise<any> => {
    const response = await api.post(`/tarefas/${tarefaId}/comentarios`, { texto, sistema });
    return response.data;
  },

  setObservadores: async (tarefaId: string, observadorIds: string[]): Promise<Tarefa> => {
    const response = await api.patch<Tarefa>(`/tarefas/${tarefaId}/observadores`, { observadorIds });
    return response.data;
  },

  uploadAnexo: async (tarefaId: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/tarefas/${tarefaId}/anexo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  importarBitrix: async (file: File, projetoId?: string, etapa?: string): Promise<{ totalLinhas: number, criadas: number, atualizadas: number, ignoradasDuplicadas: number, usuariosCriados: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (projetoId) {
      formData.append('projetoId', projetoId);
    }
    if (etapa) {
      formData.append('etapa', etapa);
    }
    const response = await api.post('/tarefas/importar-bitrix', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Exportação/importação nativa do Vivox (backup fiel de um workspace: etapa,
  // status, dono, checklist etc.) — formato distinto do import do Bitrix.
  exportarWorkspace: async (projetoId: string): Promise<any[]> => {
    const response = await api.get('/tarefas/exportar', { params: { projetoId } });
    return response.data;
  },

  importarBackup: async (file: File, projetoId: string): Promise<{ totalLinhas: number, criadas: number, ignoradas: number, usuariosCriados: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projetoId', projetoId);
    const response = await api.post('/tarefas/importar-backup', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },


  gerarChecklistIa: async (payload: { titulo: string; descricao?: string; clienteId?: string }): Promise<string[]> => {
    const response = await api.post<string[]>('/tarefas/gerar-checklist-ia', payload);
    return response.data;
  },

  // Workspaces / Projetos
  getProjetos: async (clienteId?: string): Promise<any[]> => {
    const response = await api.get('/projetos', { params: { clienteId } });
    return response.data;
  },

  getProjetoById: async (id: string): Promise<any> => {
    const response = await api.get(`/projetos/${id}`);
    return response.data;
  },

  createProjeto: async (data: {
    nome: string;
    descricao?: string;
    cor?: string;
    icone?: string;
    clienteId?: string;
    responsavelId?: string;
  }): Promise<any> => {
    const response = await api.post('/projetos', data);
    return response.data;
  },

  updateProjeto: async (
    id: string,
    data: {
      nome?: string;
      descricao?: string;
      cor?: string;
      icone?: string;
      clienteId?: string;
      responsavelId?: string;
    }
  ): Promise<any> => {
    const response = await api.patch(`/projetos/${id}`, data);
    return response.data;
  },

  deleteProjeto: async (id: string): Promise<any> => {
    const response = await api.delete(`/projetos/${id}`);
    return response.data;
  },
};
