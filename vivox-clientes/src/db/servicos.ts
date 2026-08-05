import { getDB } from './index';
import type { ServicoContratado } from '../types';

export const ServicoDAO = {
  async getByClienteId(clienteId: string): Promise<ServicoContratado[]> {
    const db = await getDB();
    return db.getAllFromIndex('servicos_contratados', 'by-cliente', clienteId);
  },

  async getById(id: string): Promise<ServicoContratado | undefined> {
    const db = await getDB();
    return db.get('servicos_contratados', id);
  },

  async create(servico: ServicoContratado): Promise<void> {
    const db = await getDB();
    await db.put('servicos_contratados', servico);
  },

  async update(servico: ServicoContratado): Promise<void> {
    const db = await getDB();
    await db.put('servicos_contratados', servico);
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('servicos_contratados', id);
  },
};
