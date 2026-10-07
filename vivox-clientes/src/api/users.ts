import { api } from './client';

export interface UserListDTO {
  id: string;
  nome: string;
  email: string;
  role: 'ADMIN' | 'COLABORADOR' | 'CLIENTE';
  modulos?: string[];
  clienteId?: string | null;
  createdAt?: string;
}

export const usersApi = {
  getUsers: async (): Promise<UserListDTO[]> => {
    const { data } = await api.get('/users');
    return data;
  },
  updateUserRole: async (id: string, role: 'ADMIN' | 'COLABORADOR'): Promise<UserListDTO> => {
    const { data } = await api.patch(`/users/${id}/role`, { role });
    return data;
  },
  updateUserModulos: async (id: string, modulos: string[]): Promise<UserListDTO> => {
    const { data } = await api.patch(`/users/${id}/modulos`, { modulos });
    return data;
  },
  getMe: async (): Promise<UserListDTO> => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};
