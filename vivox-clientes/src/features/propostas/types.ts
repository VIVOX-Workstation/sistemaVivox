export interface SecaoProposta { titulo: string; texto: string; html?: string }
export interface DocumentoProposta {
  titulo: string;
  destinatario: string;
  apresentacao: string;
  validade: string | null;
  corDestaque: string;
  secoes: SecaoProposta[];
  createdAt?: string;
  demo?: 'ensino' | null;
  // "pdf": a proposta é o arquivo enviado pela equipe (secoes vem vazio).
  formato?: 'documento' | 'pdf';
  nomeArquivo?: string | null;
  tamanho?: number | null;
}
export interface Proposta extends DocumentoProposta {
  id: string;
  updatedAt: string;
  compartilhada: boolean;
  // Só na listagem da equipe; o link público não traz quem criou.
  criadoPor?: { nome: string } | null;
}
