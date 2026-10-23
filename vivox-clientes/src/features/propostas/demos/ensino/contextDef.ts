import { createContext, type Dispatch } from 'react';
import type { Aluno, Resgate, Curso, Premio, Modulo, Aula, Questao } from './types';

export interface DemoState {
  cursos: Curso[];
  premios: Premio[];
  alunos: Aluno[];
  alunoAtualId: string | null;
  ambiente: 'aluno' | 'admin';
  cursoAtivoId: string | null;
  aulaAtivaId: string | null;
  quizAtivoModal: { cursoId: string; moduloId: string; quiz: NonNullable<Modulo['quiz']> } | null;
}

export type DemoAction =
  | { type: 'SET_AMBIENTE'; ambiente: 'aluno' | 'admin' }
  | { type: 'LOGIN_ALUNO'; alunoId: string }
  | { type: 'LOGOUT_ALUNO' }
  | { type: 'SELECIONAR_CURSO'; cursoId: string | null }
  | { type: 'SELECIONAR_AULA'; cursoId: string; aulaId: string }
  | { type: 'ABRIR_QUIZ'; cursoId: string; moduloId: string }
  | { type: 'FECHAR_QUIZ' }
  | { type: 'TOGGLE_CONCLUIR_AULA'; aulaId: string }
  | { type: 'FINALIZAR_QUIZ'; quizId: string; moduloId: string; cursoId: string; respostas: number[] }
  | { type: 'SOLICITAR_RESGATE'; premioId: string }
  | { type: 'APROVAR_RESGATE'; resgateId: string }
  | { type: 'REJEITAR_RESGATE'; resgateId: string }
  | { type: 'CRIAR_CURSO'; dados: { titulo: string; descricao: string; categoria: string; capaGradiente: string } }
  | { type: 'ATUALIZAR_CURSO'; cursoId: string; dados: Partial<Curso> }
  | { type: 'EXCLUIR_CURSO'; cursoId: string }
  | { type: 'REORDENAR_CURSO'; cursoId: string; direcao: 'subir' | 'descer' }
  | { type: 'CRIAR_MODULO'; cursoId: string; titulo: string }
  | { type: 'ATUALIZAR_MODULO'; cursoId: string; moduloId: string; titulo: string }
  | { type: 'EXCLUIR_MODULO'; cursoId: string; moduloId: string }
  | { type: 'CRIAR_AULA'; cursoId: string; moduloId: string; dados: { titulo: string; duracao: string; videoUrl: string; descricao?: string } }
  | { type: 'ATUALIZAR_AULA'; cursoId: string; moduloId: string; aulaId: string; dados: Partial<Aula> }
  | { type: 'EXCLUIR_AULA'; cursoId: string; moduloId: string; aulaId: string }
  | { type: 'SALVAR_QUESTAO'; cursoId: string; moduloId: string; questao: Omit<Questao, 'id'> & { id?: string } }
  | { type: 'EXCLUIR_QUESTAO'; cursoId: string; moduloId: string; questaoId: string }
  | { type: 'CRIAR_PREMIO'; dados: { titulo: string; descricao: string; pontos: number; icone: string } }
  | { type: 'ATUALIZAR_PREMIO'; premioId: string; dados: Partial<Premio> };

export interface DemoContextValue {
  state: DemoState;
  dispatch: Dispatch<DemoAction>;
  alunoAtual: Aluno | undefined;
  todosResgates: Resgate[];
}

export const DemoContext = createContext<DemoContextValue | null>(null);
