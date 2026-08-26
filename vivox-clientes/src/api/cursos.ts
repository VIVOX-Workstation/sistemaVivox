import { api } from './client';
import type { Curso, Modulo, Aula } from '../types';

export const cursosApi = {
  // Cursos
  uploadCursoCapa: async (id: string, file: File): Promise<Curso> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/cursos/${id}/capa`, formData, {
      headers: {
        'Content-Type': undefined
      }
    });
    return data;
  },
  getCursos: async (): Promise<Curso[]> => {
    const { data } = await api.get('/cursos');
    return data;
  },
  getCurso: async (id: string): Promise<Curso> => {
    const { data } = await api.get(`/cursos/${id}`);
    return data;
  },
  createCurso: async (cursoData: Partial<Curso>): Promise<Curso> => {
    const { data } = await api.post('/cursos', cursoData);
    return data;
  },
  updateCurso: async (id: string, cursoData: Partial<Curso>): Promise<Curso> => {
    const { data } = await api.patch(`/cursos/${id}`, cursoData);
    return data;
  },
  deleteCurso: async (id: string): Promise<void> => {
    await api.delete(`/cursos/${id}`);
  },
  reordenarCursos: async (ids: string[]): Promise<void> => {
    await api.patch('/cursos/reordenar', { ids });
  },

  // Modulos
  createModulo: async (cursoId: string, moduloData: Partial<Modulo>): Promise<Modulo> => {
    const { data } = await api.post(`/cursos/${cursoId}/modulos`, moduloData);
    return data;
  },
  updateModulo: async (moduloId: string, moduloData: Partial<Modulo>): Promise<Modulo> => {
    const { data } = await api.patch(`/cursos/modulos/${moduloId}`, moduloData);
    return data;
  },
  deleteModulo: async (moduloId: string): Promise<void> => {
    await api.delete(`/cursos/modulos/${moduloId}`);
  },
  reordenarModulos: async (cursoId: string, ids: string[]): Promise<void> => {
    await api.patch(`/cursos/modulos/curso/${cursoId}/reordenar`, { ids });
  },

  // Aulas
  uploadAulaCapa: async (aulaId: string, file: File): Promise<Aula> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/cursos/aulas/${aulaId}/capa`, formData, {
      headers: {
        'Content-Type': undefined
      }
    });
    return data;
  },
  createAula: async (moduloId: string, aulaData: Partial<Aula>): Promise<Aula> => {
    const { data } = await api.post(`/cursos/modulos/${moduloId}/aulas`, aulaData);
    return data;
  },
  updateAula: async (aulaId: string, aulaData: Partial<Aula>): Promise<Aula> => {
    const { data } = await api.patch(`/cursos/aulas/${aulaId}`, aulaData);
    return data;
  },
  deleteAula: async (aulaId: string): Promise<void> => {
    await api.delete(`/cursos/aulas/${aulaId}`);
  },
  reordenarAulas: async (moduloId: string, ids: string[]): Promise<void> => {
    await api.patch(`/cursos/aulas/modulo/${moduloId}/reordenar`, { ids });
  }
};

export const educacionalApi = {
  getCursosPublicados: async (): Promise<Curso[]> => {
    const { data } = await api.get('/educacional/cursos');
    return data;
  },
  getCursoById: async (id: string): Promise<Curso> => {
    const { data } = await api.get(`/educacional/cursos/${id}`);
    return data;
  },
  concluirAula: async (aulaId: string): Promise<void> => {
    await api.post(`/educacional/aulas/${aulaId}/concluir`);
  },
  desmarcarAula: async (aulaId: string): Promise<void> => {
    await api.delete(`/educacional/aulas/${aulaId}/concluir`);
  }
};
