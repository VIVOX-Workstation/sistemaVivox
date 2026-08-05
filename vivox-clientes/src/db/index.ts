import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Cliente, ServicoContratado, Producao, MidiaCliente } from '../types';

interface VivoxDB extends DBSchema {
  clientes: {
    key: string;
    value: Cliente;
  };
  servicos_contratados: {
    key: string;
    value: ServicoContratado;
    indexes: { 'by-cliente': string };
  };
  producoes: {
    key: string;
    value: Producao;
    indexes: { 'by-cliente': string; 'by-servico': string };
  };
  midias_cliente: {
    key: string;
    value: MidiaCliente;
    indexes: { 'by-cliente': string };
  };
}

const DB_NAME = 'vivox-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<VivoxDB>> | null = null;

export async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<VivoxDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('clientes')) {
          db.createObjectStore('clientes', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('servicos_contratados')) {
          const servicosStore = db.createObjectStore('servicos_contratados', { keyPath: 'id' });
          servicosStore.createIndex('by-cliente', 'cliente_id');
        }

        if (!db.objectStoreNames.contains('producoes')) {
          const producoesStore = db.createObjectStore('producoes', { keyPath: 'id' });
          producoesStore.createIndex('by-cliente', 'cliente_id');
          producoesStore.createIndex('by-servico', 'servico_relacionado_id');
        }

        if (!db.objectStoreNames.contains('midias_cliente')) {
          const midiasStore = db.createObjectStore('midias_cliente', { keyPath: 'id' });
          midiasStore.createIndex('by-cliente', 'cliente_id');
        }
      },
    });
  }
  return dbPromise;
}
