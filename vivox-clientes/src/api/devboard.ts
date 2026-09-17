import { api } from './client';

export type DevCardTag = 'FEATURE' | 'BUG' | 'ENHANCEMENT' | 'DOCS';
export type DevCardColuna = 'BACKLOG' | 'EM_PROGRESSO' | 'EM_REVISAO' | 'CONCLUIDO';

export interface DevChecklistItem {
  label: string;
  done: boolean;
}

export interface DevCard {
  id: string;
  servicoId: string;
  prNumber: number;
  title: string;
  tag: DevCardTag;
  coluna: DevCardColuna;
  assignee: string | null;
  branch: string;
  targetBranch: string;
  description: string | null;
  checklist: DevChecklistItem[];
  githubPrNumber: number | null;
  createdAt: string;
  updatedAt: string;
}

export const devboardApi = {
  listByServico: async (servicoId: string): Promise<DevCard[]> => {
    const res = await api.get(`/devboard/servico/${servicoId}`);
    return res.data;
  },
  create: async (dto: { servicoId: string; title: string; tag?: DevCardTag; description?: string }): Promise<DevCard> => {
    const res = await api.post('/devboard', dto);
    return res.data;
  },
  update: async (id: string, dto: Partial<Pick<DevCard, 'title' | 'tag' | 'coluna' | 'assignee' | 'branch' | 'targetBranch' | 'description' | 'checklist' | 'githubPrNumber'>>): Promise<DevCard> => {
    const res = await api.patch(`/devboard/${id}`, dto);
    return res.data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/devboard/${id}`);
  },
};
