import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrigemDado, Prisma, TipoPublicacao } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePublicacaoDto } from './dto/create-publicacao.dto';
import { UpdatePublicacaoDto } from './dto/update-publicacao.dto';

const PUBLICACAO_SELECT = {
  id: true, dataPublicacao: true, tipo: true, assunto: true, link: true,
  curtidas: true, comentarios: true, compartilhamentos: true, salvamentos: true,
  visualizacoes: true, alcance: true, origemDado: true,
} satisfies Prisma.PublicacaoSelect;

type PublicacaoResposta = Prisma.PublicacaoGetPayload<{ select: typeof PUBLICACAO_SELECT }>;

// America/Sao_Paulo com UTC-3 fixo, conforme o contrato (sem horário de verão histórico).
const FUSO_HORAS = 3;
const FUSO_MS = FUSO_HORAS * 60 * 60 * 1000;

export function intervaloMensal(ano: number, mes: number) {
  if (!Number.isInteger(ano) || ano < 1 || ano > 9999 || !Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw new BadRequestException('Informe ano válido e mês entre 1 e 12.');
  }
  // setUTCFullYear evita que Date.UTC interprete anos 1..99 como 1901..1999.
  const inicio = new Date(0);
  inicio.setUTCFullYear(ano, mes - 1, 1);
  inicio.setUTCHours(FUSO_HORAS, 0, 0, 0);
  const fim = new Date(inicio);
  fim.setUTCMonth(fim.getUTCMonth() + 1);
  return { inicio, fim };
}

// Período personalizado em dias inteiros de Brasília: [inicio 00h, dia seguinte ao fim 00h)
const MAX_DIAS_PERIODO = 731;

export function dataLocalIso(data: Date): string {
  return new Date(data.getTime() - FUSO_MS).toISOString().slice(0, 10);
}

export function intervaloPersonalizado(inicioIso: string, fimIso: string) {
  const inicio = new Date(`${inicioIso}T00:00:00-03:00`);
  const fim = new Date(`${fimIso}T00:00:00-03:00`);
  // Recusa datas inexistentes (ex.: 2025-02-30), que o Date ajustaria em silêncio
  if (isNaN(inicio.getTime()) || isNaN(fim.getTime()) || dataLocalIso(inicio) !== inicioIso || dataLocalIso(fim) !== fimIso) {
    throw new BadRequestException('Informe datas válidas no formato AAAA-MM-DD.');
  }
  if (fim < inicio) throw new BadRequestException('A data final deve ser igual ou posterior à inicial.');
  fim.setUTCDate(fim.getUTCDate() + 1);
  if ((fim.getTime() - inicio.getTime()) / 86_400_000 > MAX_DIAS_PERIODO) {
    throw new BadRequestException('O período pode ter no máximo 2 anos.');
  }
  return { inicio, fim };
}

export interface FiltroPeriodo {
  ano?: number;
  mes?: number;
  inicio?: string;
  fim?: string;
  tipos?: TipoPublicacao[];
}

function resolverPeriodo(filtro: FiltroPeriodo) {
  if (filtro.inicio !== undefined || filtro.fim !== undefined) {
    if (!filtro.inicio || !filtro.fim) throw new BadRequestException('Informe a data inicial e a final do período.');
    return intervaloPersonalizado(filtro.inicio, filtro.fim);
  }
  if (filtro.ano === undefined || filtro.mes === undefined) {
    throw new BadRequestException('Informe ano e mês ou um período (inicio e fim).');
  }
  return intervaloMensal(filtro.ano, filtro.mes);
}

// "2025-02-01" puro viraria meia-noite UTC = 21h de 31/01 em Brasília (mês errado).
// Data sem horário é fixada ao meio-dia de Brasília, longe das viradas de dia.
export function paraDataPublicacao(valor: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? new Date(`${valor}T12:00:00-03:00`) : new Date(valor);
}

function respostaPublicacao(publicacao: PublicacaoResposta) {
  return { ...publicacao, dataPublicacao: publicacao.dataPublicacao.toISOString() };
}

@Injectable()
export class AcompanhamentoService {
  constructor(private readonly prisma: PrismaService) {}

  private async cliente(clienteId: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId }, select: { id: true, nomeFantasia: true, logoUrl: true },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado.');
    return cliente;
  }

  listar(clienteId: string, ano: number, mes: number) {
    return this.consultar(clienteId, { ano, mes });
  }

  async consultar(clienteId: string, filtro: FiltroPeriodo) {
    const { inicio, fim } = resolverPeriodo(filtro);
    const cliente = await this.cliente(clienteId);
    const publicacoes = await this.prisma.publicacao.findMany({
      where: {
        clienteId,
        dataPublicacao: { gte: inicio, lt: fim },
        ...(filtro.tipos?.length ? { tipo: { in: filtro.tipos } } : {}),
      },
      orderBy: [{ dataPublicacao: 'asc' }, { createdAt: 'asc' }],
      select: PUBLICACAO_SELECT,
    });
    const porTipo = Object.fromEntries(Object.values(TipoPublicacao).map((tipo) => [tipo, 0])) as Record<TipoPublicacao, number>;
    const totais = { curtidas: 0, comentarios: 0, compartilhamentos: 0, salvamentos: 0, visualizacoes: 0 };
    for (const publicacao of publicacoes) {
      porTipo[publicacao.tipo]++;
      for (const campo of Object.keys(totais) as (keyof typeof totais)[]) {
        totais[campo] += publicacao[campo] ?? 0;
      }
    }
    return {
      cliente,
      ano: filtro.inicio ? null : filtro.ano ?? null,
      mes: filtro.inicio ? null : filtro.mes ?? null,
      // Datas inclusivas, no fuso de Brasília
      periodo: { inicio: dataLocalIso(inicio), fim: dataLocalIso(new Date(fim.getTime() - 1)) },
      publicacoes: publicacoes.map(respostaPublicacao),
      resumo: { total: publicacoes.length, porTipo, totais },
    };
  }

  async meses(clienteId: string) {
    await this.cliente(clienteId);
    const publicacoes = await this.prisma.publicacao.findMany({
      where: { clienteId }, select: { dataPublicacao: true },
    });
    const meses = new Map<string, { ano: number; mes: number; total: number }>();
    for (const publicacao of publicacoes) {
      const local = new Date(publicacao.dataPublicacao.getTime() - FUSO_MS);
      const ano = local.getUTCFullYear();
      const mes = local.getUTCMonth() + 1;
      const chave = `${ano}-${mes}`;
      const grupo = meses.get(chave) ?? { ano, mes, total: 0 };
      grupo.total++;
      meses.set(chave, grupo);
    }
    return [...meses.values()].sort((a, b) => b.ano - a.ano || b.mes - a.mes);
  }

  async criar(clienteId: string, dto: CreatePublicacaoDto) {
    await this.cliente(clienteId);
    const publicacao = await this.prisma.publicacao.create({
      data: { ...dto, clienteId, dataPublicacao: paraDataPublicacao(dto.dataPublicacao), origemDado: OrigemDado.MANUAL },
      select: PUBLICACAO_SELECT,
    });
    return respostaPublicacao(publicacao);
  }

  async atualizar(id: string, dto: UpdatePublicacaoDto) {
    await this.exigirPublicacao(id);
    try {
      const publicacao = await this.prisma.publicacao.update({
        where: { id },
        data: { ...dto, ...(dto.dataPublicacao !== undefined ? { dataPublicacao: paraDataPublicacao(dto.dataPublicacao) } : {}) },
        select: PUBLICACAO_SELECT,
      });
      return respostaPublicacao(publicacao);
    } catch (error) {
      this.tratarPublicacaoAusente(error);
    }
  }

  async remover(id: string) {
    await this.exigirPublicacao(id);
    try {
      await this.prisma.publicacao.delete({ where: { id } });
      return { ok: true };
    } catch (error) {
      this.tratarPublicacaoAusente(error);
    }
  }

  private async exigirPublicacao(id: string) {
    const publicacao = await this.prisma.publicacao.findUnique({ where: { id }, select: { id: true } });
    if (!publicacao) throw new NotFoundException('Publicação não encontrada.');
  }

  private tratarPublicacaoAusente(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundException('Publicação não encontrada.');
    }
    throw error;
  }
}
