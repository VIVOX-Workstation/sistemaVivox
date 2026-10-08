import { api } from './client';

export interface CronogramaEnviadoPor {
  id: string;
  nome: string;
}

export interface Cronograma {
  id: string;
  titulo: string;
  ano: number | null;
  mes: number | null;
  nomeArquivo: string;
  tamanho: number; // tamanho em bytes
  createdAt: string; // ISO
  enviadoPor?: CronogramaEnviadoPor | null;
}

export interface EnviarCronogramaDTO {
  arquivo: File;
  titulo: string;
  ano?: number | null;
  mes?: number | null;
}

export const cronogramasApi = {
  // Interno (equipe / módulo Acompanhamento)
  listarPorCliente: async (clienteId: string): Promise<Cronograma[]> => {
    const { data } = await api.get(`/acompanhamento/clientes/${clienteId}/cronogramas`);
    return data;
  },

  enviar: async (
    clienteId: string,
    dto: EnviarCronogramaDTO,
    onProgress?: (porcentagem: number) => void,
  ): Promise<Cronograma> => {
    const formData = new FormData();
    formData.append('arquivo', dto.arquivo);
    formData.append('titulo', dto.titulo);
    if (dto.ano !== undefined && dto.ano !== null) {
      formData.append('ano', String(dto.ano));
    }
    if (dto.mes !== undefined && dto.mes !== null) {
      formData.append('mes', String(dto.mes));
    }

    const { data } = await api.post(`/acompanhamento/clientes/${clienteId}/cronogramas`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return data;
  },

  baixarArquivo: async (id: string): Promise<Blob> => {
    const response = await api.get(`/acompanhamento/cronogramas/${id}/arquivo`, {
      responseType: 'blob',
    });
    return response.data;
  },

  excluir: async (id: string): Promise<{ ok: boolean }> => {
    const { data } = await api.delete(`/acompanhamento/cronogramas/${id}`);
    return data;
  },

  // Portal (Cliente logado, somente leitura)
  portalListar: async (): Promise<Cronograma[]> => {
    const { data } = await api.get('/portal/cronogramas');
    return data;
  },

  portalBaixarArquivo: async (id: string): Promise<Blob> => {
    const response = await api.get(`/portal/cronogramas/${id}/arquivo`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

/** Formata bytes para B, KB ou MB legível com vírgula (ex: 1,2 MB) */
export function formatarTamanhoBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

const MESES_LABEL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/** Formata mês e ano de referência ou retorna 'Sem referência' */
export function formatarMesReferencia(mes?: number | null, ano?: number | null): string {
  if (mes && ano) {
    const nomeMes = MESES_LABEL[mes - 1] || `Mês ${mes}`;
    return `${nomeMes} de ${ano}`;
  }
  if (ano) return String(ano);
  return 'Sem referência';
}
