import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTarefaDto } from './dto/create-tarefa.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';
import { AddChecklistItemDto, UpdateChecklistItemDto } from './dto/checklist.dto';
import { AddComentarioDto } from './dto/comentario.dto';
import { GerarChecklistIaDto } from './dto/gerar-checklist-ia.dto';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { PrioridadeTarefa } from '@prisma/client';
import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';

@Injectable()
export class TarefasService {
  private readonly logger = new Logger(TarefasService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    status?: string;
    prioridade?: PrioridadeTarefa;
    responsavelId?: string;
    clienteId?: string;
    projetoId?: string;
  }) {
    const { search, status, prioridade, responsavelId, clienteId, projetoId } = params;

    const where: any = {};

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (prioridade) where.prioridade = prioridade;
    if (responsavelId) where.responsavelId = responsavelId;
    if (clienteId) where.clienteId = clienteId;
    if (projetoId) where.projetoId = projetoId;

    return this.prisma.tarefa.findMany({
      where,
      include: {
        responsavel: { select: { id: true, nome: true, email: true } },
        autor: { select: { id: true, nome: true, email: true } },
        cliente: { select: { id: true, nomeFantasia: true } },
        projeto: { select: { id: true, nome: true, cor: true } },
        checklist: {
          select: { id: true, titulo: true, concluido: true, ordem: true },
          orderBy: { ordem: 'asc' },
        },
        _count: {
          select: {
            checklist: true,
            comentarios: true,
          },
        },
      },
      orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getMetricas() {
    const agora = new Date();
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - agora.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const [total, emAndamento, atrasadas, concluidasSemana, totalHoras] = await Promise.all([
      this.prisma.tarefa.count(),
      this.prisma.tarefa.count({
        where: { status: 'EM_ANDAMENTO' },
      }),
      this.prisma.tarefa.count({
        where: {
          status: { notIn: ['CONCLUIDA', 'CANCELADA'] },
          prazo: { lt: agora },
        },
      }),
      this.prisma.tarefa.count({
        where: {
          status: 'CONCLUIDA',
          dataConclusao: { gte: inicioSemana },
        },
      }),
      this.prisma.tarefa.aggregate({
        _sum: { horasGastas: true },
      }),
    ]);

    return {
      total,
      emAndamento,
      atrasadas,
      concluidasSemana,
      horasGastasTotal: totalHoras._sum.horasGastas || 0,
    };
  }

  async findOne(id: string) {
    const tarefa = await this.prisma.tarefa.findUnique({
      where: { id },
      include: {
        responsavel: { select: { id: true, nome: true, email: true } },
        autor: { select: { id: true, nome: true, email: true } },
        cliente: { select: { id: true, nomeFantasia: true, logoUrl: true } },
        projeto: { select: { id: true, nome: true, cor: true } },
        servico: { select: { id: true, tipoServico: true, status: true } },
        checklist: {
          orderBy: { ordem: 'asc' },
        },
        comentarios: {
          include: {
            autor: { select: { id: true, nome: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!tarefa) throw new NotFoundException('Tarefa não encontrada');
    return tarefa;
  }

  async create(dto: CreateTarefaDto, autorId?: string) {
    const { checklist, prazo, dataInicio, ...rest } = dto;

    const data: any = {
      ...rest,
      prazo: prazo ? new Date(prazo) : undefined,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      autorId: autorId || undefined,
    };

    if (checklist && checklist.length > 0) {
      data.checklist = {
        create: checklist.map((titulo, index) => ({
          titulo,
          ordem: index,
          concluido: false,
        })),
      };
    }

    return this.prisma.tarefa.create({
      data,
      include: {
        responsavel: { select: { id: true, nome: true, email: true } },
        autor: { select: { id: true, nome: true, email: true } },
        cliente: { select: { id: true, nomeFantasia: true } },
        projeto: { select: { id: true, nome: true, cor: true } },
        checklist: { orderBy: { ordem: 'asc' } },
      },
    });
  }

  async update(id: string, dto: UpdateTarefaDto) {
    await this.findOne(id);

    const { checklist, prazo, dataInicio, dataConclusao, ...rest } = dto;

    let conclDate = dataConclusao ? new Date(dataConclusao) : undefined;
    if (dto.status === 'CONCLUIDA' && !conclDate) {
      conclDate = new Date();
    } else if (dto.status && dto.status !== 'CONCLUIDA') {
      conclDate = null as any;
    }

    const data: any = { ...rest };
    if (prazo !== undefined) data.prazo = prazo ? new Date(prazo) : null;
    if (dataInicio !== undefined) data.dataInicio = dataInicio ? new Date(dataInicio) : null;
    if (conclDate !== undefined) data.dataConclusao = conclDate;

    return this.prisma.tarefa.update({
      where: { id },
      data,
      include: {
        responsavel: { select: { id: true, nome: true, email: true } },
        autor: { select: { id: true, nome: true, email: true } },
        cliente: { select: { id: true, nomeFantasia: true } },
        projeto: { select: { id: true, nome: true, cor: true } },
        checklist: { orderBy: { ordem: 'asc' } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.tarefa.delete({ where: { id } });
  }

  async addChecklistItem(tarefaId: string, dto: AddChecklistItemDto) {
    await this.findOne(tarefaId);
    return this.prisma.tarefaChecklist.create({
      data: {
        tarefaId,
        titulo: dto.titulo,
        ordem: dto.ordem ?? 0,
      },
    });
  }

  async updateChecklistItem(itemId: string, dto: UpdateChecklistItemDto) {
    const item = await this.prisma.tarefaChecklist.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item de checklist não encontrado');

    return this.prisma.tarefaChecklist.update({
      where: { id: itemId },
      data: dto,
    });
  }

  async removeChecklistItem(itemId: string) {
    const item = await this.prisma.tarefaChecklist.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item de checklist não encontrado');

    return this.prisma.tarefaChecklist.delete({ where: { id: itemId } });
  }

  async addComentario(tarefaId: string, autorId: string, dto: AddComentarioDto) {
    await this.findOne(tarefaId);

    let userId = autorId;
    if (!userId) {
      const user = await this.prisma.user.findFirst();
      if (user) userId = user.id;
    }

    if (!userId) {
      throw new NotFoundException('Usuário autor não encontrado');
    }

    return this.prisma.tarefaComentario.create({
      data: {
        tarefaId,
        autorId: userId,
        texto: dto.texto,
      },
      include: {
        autor: { select: { id: true, nome: true, email: true } },
      },
    });
  }

  async gerarChecklistIa(dto: GerarChecklistIaDto) {
    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
      return [
        'Definir escopo detalhado',
        'Coletar referências visuais',
        'Elaborar primeira versão',
        'Revisar detalhes operacionais',
        'Validar com o cliente e finalizar',
      ];
    }

    try {
      const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system:
          'Você é um Gerente de Projetos e Operações sênior de agência (Vivox GP). Retorne SEMPRE E EXCLUSIVAMENTE um array JSON de strings com 4 a 7 subtarefas acionáveis, concisas e práticas para a tarefa informada. Não inclua markdown, apenas o array JSON válido.',
        prompt: `Tarefa: "${dto.titulo}".
Descrição/Contexto: "${dto.descricao || 'Sem descrição'}".

Gere o checklist em formato JSON:
["Etapa 1", "Etapa 2", "Etapa 3", "Etapa 4"]`,
      });

      const cleaned = text.replace(/```json\n?|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      this.logger.warn(`Fallback na geração de checklist por IA: ${e}`);
    }

    return [
      'Alinhar requisitos e briefing',
      'Estruturar execução técnica',
      'Revisão interna de qualidade',
      'Aprovação final e entrega',
    ];
  }

  // ============================================
  // WORKSPACES / PROJETOS
  // ============================================

  async findAllProjetos(clienteId?: string) {
    const where: any = {};
    if (clienteId) where.clienteId = clienteId;

    return this.prisma.projeto.findMany({
      where,
      include: {
        cliente: { select: { id: true, nomeFantasia: true } },
        responsavel: { select: { id: true, nome: true, email: true } },
        _count: {
          select: {
            tarefas: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findProjetoById(id: string) {
    const projeto = await this.prisma.projeto.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, nomeFantasia: true, logoUrl: true } },
        responsavel: { select: { id: true, nome: true, email: true } },
        tarefas: {
          include: {
            responsavel: { select: { id: true, nome: true } },
            checklist: true,
          },
          orderBy: { ordem: 'asc' },
        },
        _count: {
          select: { tarefas: true },
        },
      },
    });

    if (!projeto) throw new NotFoundException('Workspace / Projeto não encontrado');
    return projeto;
  }

  async createProjeto(dto: CreateProjetoDto) {
    return this.prisma.projeto.create({
      data: dto,
      include: {
        cliente: { select: { id: true, nomeFantasia: true } },
        responsavel: { select: { id: true, nome: true, email: true } },
        _count: { select: { tarefas: true } },
      },
    });
  }

  async updateProjeto(id: string, dto: UpdateProjetoDto) {
    await this.findProjetoById(id);
    return this.prisma.projeto.update({
      where: { id },
      data: dto,
      include: {
        cliente: { select: { id: true, nomeFantasia: true } },
        responsavel: { select: { id: true, nome: true, email: true } },
        _count: { select: { tarefas: true } },
      },
    });
  }

  async removeProjeto(id: string) {
    await this.findProjetoById(id);
    return this.prisma.projeto.delete({ where: { id } });
  }
}
