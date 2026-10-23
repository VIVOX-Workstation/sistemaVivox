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
}
export interface Proposta extends DocumentoProposta {
  id: string;
  updatedAt: string;
  compartilhada: boolean;
}
