import { api } from './client';

export interface UserListDTO {
  id: string;
  nome: string;
  email: string;
  role: 'ADMIN' | 'COLABORADOR';
}

export const usersApi = {
  getUsers: async (): Promise<UserListDTO[]> => {
    const { data } = await api.get('/users');
    return data;
  },
  updateUserRole: async (id: string, role: 'ADMIN' | 'COLABORADOR'): Promise<UserListDTO> => {
    const { data } = await api.patch(`/users/${id}/role`, { role });
    return data;
  }
};
