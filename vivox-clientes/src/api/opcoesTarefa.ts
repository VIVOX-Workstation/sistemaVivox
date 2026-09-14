import { api } from './client';
import { tarefasApi } from './tarefas';
import type { Cliente, Projeto } from '../types';

export interface UserOption {
  id: string;
  nome: string;
  email: string;
}

export interface OpcoesTarefa {
  usuarios: UserOption[];
  clientes: Cliente[];
  workspaces: Projeto[];
}

const TTL_MS = 2 * 60 * 1000;

let cache: OpcoesTarefa | null = null;
let cacheTimestamp = 0;
let inflight: Promise<OpcoesTarefa> | null = null;

async function fetchOpcoesTarefa(): Promise<OpcoesTarefa> {
  const [usersRes, clientesRes, workspaces] = await Promise.all([
    api.get<UserOption[]>('/users').catch(() => ({ data: [] })),
    api.get<Cliente[]>('/clientes').catch(() => ({ data: [] })),
    tarefasApi.getProjetos().catch(() => []),
  ]);
  return {
    usuarios: usersRes.data || [],
    clientes: clientesRes.data || [],
    workspaces: workspaces || [],
  };
}

// Usuários, clientes e workspaces mudam raramente durante uma sessão; evita
// refazer essas 3 chamadas toda vez que um modal de tarefa é aberto.
export function carregarOpcoesTarefa(): Promise<OpcoesTarefa> {
  const expirado = Date.now() - cacheTimestamp > TTL_MS;
  if (cache && !expirado) {
    return Promise.resolve(cache);
  }
  if (!inflight) {
    inflight = fetchOpcoesTarefa()
      .then((opcoes) => {
        cache = opcoes;
        cacheTimestamp = Date.now();
        return opcoes;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function invalidarOpcoesTarefa() {
  cache = null;
  cacheTimestamp = 0;
}
