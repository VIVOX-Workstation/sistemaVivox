import type { BackupAcompanhamento, ItemImportacao } from '../../api/acompanhamento';

// Backup JSON do acompanhamento: guarda as publicações exatamente como estão no banco
// (data com horário, origem do dado). Importar de volta atualiza pelo id ou cria novas.

const CAMPOS: (keyof ItemImportacao)[] = [
  'id', 'dataPublicacao', 'tipo', 'assunto', 'link',
  'curtidas', 'comentarios', 'reposts', 'compartilhamentos', 'salvamentos', 'visualizacoes', 'alcance',
  'origemDado',
];

export function baixarJson(backup: BackupAcompanhamento, nomeArquivo: string) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface BackupLido {
  publicacoes: ItemImportacao[];
  clienteOrigem?: string; // nome do cliente de onde o backup saiu
}

/** Lê o arquivo exportado (ou uma lista simples de publicações). Lança Error com mensagem amigável. */
export function lerBackupJson(texto: string): BackupLido {
  let dados: unknown;
  try {
    dados = JSON.parse(texto.replace(/^﻿/, ''));
  } catch {
    throw new Error('O arquivo não é um JSON válido.');
  }
  const objeto = dados as Partial<BackupAcompanhamento> | null;
  const lista = Array.isArray(dados) ? dados : objeto?.publicacoes;
  if (!Array.isArray(lista)) {
    throw new Error('O arquivo não parece ser um backup do acompanhamento (falta a lista "publicacoes").');
  }
  // Leva só os campos conhecidos; a validação completa é feita pelo servidor
  const publicacoes = lista.map((item, i) => {
    if (!item || typeof item !== 'object') throw new Error(`A publicação ${i + 1} do arquivo está em formato inválido.`);
    return Object.fromEntries(
      CAMPOS.filter((c) => (item as Record<string, unknown>)[c] !== undefined).map((c) => [c, (item as Record<string, unknown>)[c]]),
    ) as unknown as ItemImportacao;
  });
  return { publicacoes, clienteOrigem: Array.isArray(dados) ? undefined : objeto?.cliente?.nomeFantasia };
}
