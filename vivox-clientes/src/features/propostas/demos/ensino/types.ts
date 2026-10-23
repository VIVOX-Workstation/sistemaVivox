export interface Alternativa {
  id: string;
  texto: string;
}

export interface Questao {
  id: string;
  enunciado: string;
  alternativas: Alternativa[];
  corretaIndex: number;
  pontos: number;
  explicacao?: string;
}

export interface Quiz {
  id: string;
  moduloId: string;
  titulo: string;
  questoes: Questao[];
}

export interface Aula {
  id: string;
  moduloId: string;
  titulo: string;
  duracao: string;
  videoUrl: string;
  ordem: number;
  descricao?: string;
}

export interface Modulo {
  id: string;
  cursoId: string;
  titulo: string;
  ordem: number;
  aulas: Aula[];
  quiz?: Quiz;
}

export interface Curso {
  id: string;
  titulo: string;
  descricao: string;
  capaGradiente: string;
  categoria: string;
  ativo: boolean;
  ordem: number;
  modulos: Modulo[];
}

export interface Premio {
  id: string;
  titulo: string;
  descricao: string;
  pontos: number;
  icone: string;
  disponivel: boolean;
}

export interface TransacaoPontos {
  id: string;
  data: string;
  tipo: 'ganho' | 'resgate' | 'reembolso';
  descricao: string;
  pontos: number;
}

export interface Resgate {
  id: string;
  alunoId: string;
  alunoNome: string;
  premioId: string;
  premioTitulo: string;
  pontos: number;
  data: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
}

export interface QuizResultado {
  acertos: number;
  total: number;
  pontosGanhos: number;
  respondidoEm: string;
}

export interface Aluno {
  id: string;
  nome: string;
  email: string;
  avatar: string;
  pontos: number;
  concluidasAulaIds: string[];
  quizzesConcluidos: Record<string, QuizResultado>;
  resgates: Resgate[];
  historicoPontos: TransacaoPontos[];
  ultimaAula?: { cursoId: string; aulaId: string };
}
