import { getDB } from './index';
import type { Cliente } from '../types';

export const ClienteDAO = {
  async getAll(): Promise<Cliente[]> {
    const db = await getDB();
    return db.getAll('clientes');
  },

  async getById(id: string): Promise<Cliente | undefined> {
    const db = await getDB();
    return db.get('clientes', id);
  },

  async create(cliente: Cliente): Promise<void> {
    const db = await getDB();
    await db.put('clientes', cliente);
  },

  async update(cliente: Cliente): Promise<void> {
    const db = await getDB();
    await db.put('clientes', cliente);
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('clientes', id);
  },
};
