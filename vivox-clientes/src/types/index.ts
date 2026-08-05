export type StatusCliente = 'ativo' | 'pausado' | 'encerrado' | 'prospect';

export interface Contato {
  id: string;
  nome: string;
  cargo: string;
  telefone: string;
  email: string;
  whatsapp: string;
}

export interface Cliente {
  id: string;
  nomeFantasia: string;
  razaoSocial?: string;
  cnpjCpf?: string;
  segmento: string;
  responsavelId?: string;
  contatos: Contato[];
  status: StatusCliente;
  dataInicioContrato?: string; // ISO date string
  dataFimContrato?: string; // ISO date string
  logoUrl?: string;
  observacoes?: string;
  responsavel?: { nome: string }; // Incluído caso o Prisma dê include
}

export type TipoServico = 
  | 'GERENCIAMENTO_REDES' 
  | 'FOLDER' 
  | 'REVISTA' 
  | 'LANDING_PAGE' 
  | 'APP' 
  | 'FOTOGRAFIA' 
  | 'VIDEO' 
  | 'TRAFEGO_PAGO' 
  | 'IDENTIDADE_VISUAL';

export type StatusServico = 'ATIVO' | 'CONCLUIDO' | 'PAUSADO' | 'CANCELADO';

export interface HistoricoServico {
  id: string;
  data: string; // ISO date string
  usuario: string;
  acao: string;
  observacao: string;
}

export interface ServicoContratado {
  id: string;
  cliente_id: string;
  tipo_servico: TipoServico;
  status: StatusServico;
  data_contratacao: string; // ISO date string
  data_entrega_renovacao?: string; // ISO date string
  descricao_escopo: string;
  historico: HistoricoServico[];
}

export type TipoProducao = 'post' | 'video' | 'folder' | 'revista' | 'landing_page' | 'app' | 'foto';
export type StatusProducao = 'em_producao' | 'em_revisao' | 'aprovado' | 'publicado';

export interface Producao {
  id: string;
  cliente_id: string;
  servico_relacionado_id?: string;
  tipo: TipoProducao;
  arquivo_url: string;
  data_producao: string;
  responsavel: string;
  status: StatusProducao;
}

export interface MidiaCliente {
  id: string;
  cliente_id: string;
  arquivo_url: string;
  tags: string[];
}
