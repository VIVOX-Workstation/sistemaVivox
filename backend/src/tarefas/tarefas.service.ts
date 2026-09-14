import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTarefaDto } from './dto/create-tarefa.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';
import { AddChecklistItemDto, UpdateChecklistItemDto } from './dto/checklist.dto';
import { AddComentarioDto } from './dto/comentario.dto';
import { SetObservadoresDto } from './dto/observadores.dto';
import { GerarChecklistIaDto } from './dto/gerar-checklist-ia.dto';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { PrioridadeTarefa } from '@prisma/client';
import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import * as bcrypt from 'bcrypt';


@Injectable()
export class TarefasService {
  private readonly logger = new Logger(TarefasService.name);

  constructor(private readonly prisma: PrismaService) {}

  private readonly tarefaInclude = {
    responsavel: { select: { id: true, nome: true, email: true } },
    autor: { select: { id: true, nome: true, email: true } },
    cliente: { select: { id: true, nomeFantasia: true } },
    projeto: { select: { id: true, nome: true, cor: true } },
    servico: { select: { id: true, tipoServico: true, status: true } },
    checklist: {
      select: { id: true, titulo: true, concluido: true, ordem: true },
      orderBy: { ordem: 'asc' as const },
    },
    _count: {
      select: {
        checklist: true,
        comentarios: true,
      },
    },
  };

  private buildTarefaWhere(params: {
    search?: string;
    status?: string;
    prioridade?: PrioridadeTarefa;
    responsavelId?: string;
    clienteId?: string;
    projetoId?: string;
    servicoId?: string;
  }) {
    const { search, status, prioridade, responsavelId, clienteId, projetoId, servicoId } = params;

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
    if (servicoId) where.servicoId = servicoId;

    return where;
  }

  async findAll(params: {
    search?: string;
    status?: string;
    prioridade?: PrioridadeTarefa;
    responsavelId?: string;
    clienteId?: string;
    projetoId?: string;
    servicoId?: string;
  }) {
    return this.prisma.tarefa.findMany({
      where: this.buildTarefaWhere(params),
      include: this.tarefaInclude,
      orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }],
    });
  }

  // Busca paginada de uma única etapa/coluna do Kanban. A etapa (coluna do
  // quadro) é um valor livre armazenado em `status` — pode ser um dos status
  // padrão (A_FAZER, EM_ANDAMENTO, CONCLUIDA) ou o id de uma coluna custom
  // criada pelo usuário (ex: "col_123_producao"). Usado para carregar cada
  // coluna do Kanban sob demanda, em vez de trazer o workspace inteiro de uma vez.
  async findColuna(params: {
    projetoId?: string;
    status: string;
    search?: string;
    prioridade?: PrioridadeTarefa;
    responsavelId?: string;
    clienteId?: string;
    servicoId?: string;
    skip?: number;
    take?: number;
  }) {
    const { skip = 0, take = 30, ...filtros } = params;
    const where = this.buildTarefaWhere(filtros);

    const [items, total] = await Promise.all([
      this.prisma.tarefa.findMany({
        where,
        include: this.tarefaInclude,
        orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.tarefa.count({ where }),
    ]);

    return { items, total };
  }

  // Resumo agregado usado pelo cabeçalho do Kanban (contadores das pílulas de
  // filtro e de cada coluna/etapa), sem precisar carregar as tarefas em si.
  // Os filtros aqui são os mesmos da busca/pílulas, exceto o status/etapa em
  // específico — os contadores por etapa cobrem exatamente essa dimensão.
  async getResumoEtapas(params: {
    projetoId?: string;
    search?: string;
    prioridade?: PrioridadeTarefa;
    responsavelId?: string;
    clienteId?: string;
    servicoId?: string;
  }) {
    const where = this.buildTarefaWhere(params);

    const [porEtapa, total, emAndamento, concluidas, urgentes] = await Promise.all([
      this.prisma.tarefa.groupBy({ by: ['status'], where, _count: { _all: true } }),
      this.prisma.tarefa.count({ where }),
      this.prisma.tarefa.count({ where: { ...where, status: 'EM_ANDAMENTO' } }),
      this.prisma.tarefa.count({ where: { ...where, status: 'CONCLUIDA' } }),
      this.prisma.tarefa.count({ where: { ...where, prioridade: 'URGENTE' } }),
    ]);

    const contadoresPorEtapa: Record<string, number> = {};
    for (const g of porEtapa) contadoresPorEtapa[g.status] = g._count._all;

    return { contadoresPorEtapa, total, emAndamento, concluidas, urgentes };
  }

  // Move em massa todas as tarefas de uma etapa para outra dentro de um
  // workspace. Usado ao excluir uma coluna do Kanban que ainda tem tarefas —
  // sem isso, precisaríamos carregar todos os ids da coluna no cliente só
  // pra movê-los um a um.
  async moverEtapa(params: { projetoId?: string; statusOrigem: string; statusDestino: string }) {
    const { projetoId, statusOrigem, statusDestino } = params;
    const where: any = { status: statusOrigem };
    if (projetoId) where.projetoId = projetoId;
    const result = await this.prisma.tarefa.updateMany({ where, data: { status: statusDestino } });
    return { movidas: result.count };
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
        observadores: { select: { id: true, nome: true, email: true } },
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

  async update(id: string, dto: UpdateTarefaDto, usuarioId?: string, role?: string) {
    const tarefaExistente = await this.findOne(id);

    const { checklist, prazo, dataInicio, dataConclusao, ...rest } = dto;

    const novoPrazoValue = prazo !== undefined ? (prazo ? new Date(prazo) : null) : undefined;
    const prazoAtualTs = tarefaExistente.prazo ? tarefaExistente.prazo.getTime() : null;
    const novoPrazoTs = novoPrazoValue === undefined ? undefined : novoPrazoValue ? novoPrazoValue.getTime() : null;
    const prazoAlterado = novoPrazoTs !== undefined && novoPrazoTs !== prazoAtualTs;

    if (prazoAlterado && role !== 'ADMIN') {
      throw new ForbiddenException('Apenas administradores podem alterar o prazo da tarefa.');
    }

    let conclDate = dataConclusao ? new Date(dataConclusao) : undefined;
    if (dto.status === 'CONCLUIDA' && !conclDate) {
      conclDate = new Date();
    } else if (dto.status && dto.status !== 'CONCLUIDA') {
      conclDate = null as any;
    }

    const data: any = { ...rest };
    if (prazo !== undefined) data.prazo = novoPrazoValue;
    if (dataInicio !== undefined) data.dataInicio = dataInicio ? new Date(dataInicio) : null;
    if (conclDate !== undefined) data.dataConclusao = conclDate;

    const tarefaAtualizada = await this.prisma.tarefa.update({
      where: { id },
      data,
      include: {
        responsavel: { select: { id: true, nome: true, email: true } },
        autor: { select: { id: true, nome: true, email: true } },
        cliente: { select: { id: true, nomeFantasia: true } },
        projeto: { select: { id: true, nome: true, cor: true } },
        servico: { select: { id: true, tipoServico: true, status: true } },
        checklist: { orderBy: { ordem: 'asc' } },
      },
    });

    // Se a tarefa estiver vinculada a um serviço e foi concluída, registra no histórico do serviço
    const servicoAlvoId = dto.servicoId || tarefaExistente.servicoId;
    if (dto.status === 'CONCLUIDA' && tarefaExistente.status !== 'CONCLUIDA' && servicoAlvoId) {
      try {
        let nomeUsuario = 'Equipe Vivox';
        let fallbackUserId = usuarioId || tarefaExistente.autorId || tarefaExistente.responsavelId;

        if (usuarioId) {
          const user = await this.prisma.user.findUnique({ where: { id: usuarioId } });
          if (user?.nome) nomeUsuario = user.nome;
        }

        if (!fallbackUserId) {
          const firstUser = await this.prisma.user.findFirst();
          fallbackUserId = firstUser?.id || null;
        }

        if (fallbackUserId) {
          await this.prisma.servicoHistorico.create({
            data: {
              servicoId: servicoAlvoId,
              usuarioId: fallbackUserId,
              acao: `Demanda "${tarefaExistente.titulo}" concluída no Vivox GP por ${nomeUsuario}.`,
            },
          });
        }
      } catch (err) {
        this.logger.warn('Aviso: Não foi possível registrar histórico do serviço:', err);
      }
    }

    // Se a tarefa é originada de um Chamado, sincroniza o status do chamado
    if (dto.status && dto.status !== tarefaExistente.status) {
      try {
        const statusChamado =
          dto.status === 'CONCLUIDA' || dto.status === 'CANCELADA'
            ? 'RESOLVIDO'
            : dto.status === 'A_FAZER' || dto.status === 'BACKLOG'
              ? 'ABERTO'
              : 'EM_ANDAMENTO';

        await this.prisma.chamado.update({
          where: { tarefaId: id },
          data: {
            status: statusChamado,
            resolvidoEm: statusChamado === 'RESOLVIDO' ? new Date() : null,
          },
        });
      } catch (err) {
        // Tarefa não é um chamado (não há Chamado com esse tarefaId) — ignora
      }
    }

    // Registra a alteração de prazo no bate-papo da tarefa (apenas admins chegam até aqui)
    if (prazoAlterado) {
      try {
        let autorId = usuarioId;
        if (!autorId) {
          const primeiroUsuario = await this.prisma.user.findFirst();
          autorId = primeiroUsuario?.id;
        }

        if (autorId) {
          const texto = novoPrazoValue
            ? `alterou o prazo para ${this.formatarPrazoPtBr(novoPrazoValue)}.`
            : 'removeu o prazo da tarefa.';

          await this.prisma.tarefaComentario.create({
            data: { tarefaId: id, autorId, texto, sistema: true },
          });
        }
      } catch (err) {
        this.logger.warn('Aviso: não foi possível registrar alteração de prazo no histórico:', err);
      }
    }

    return tarefaAtualizada;
  }

  private formatarPrazoPtBr(date: Date): string {
    const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    }).format(date);
    const horaFormatada = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Sao_Paulo',
    }).format(date);
    return `${dataFormatada}, ${horaFormatada}`;
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
        sistema: dto.sistema ?? false,
      },
      include: {
        autor: { select: { id: true, nome: true, email: true } },
      },
    });
  }

  async setObservadores(tarefaId: string, observadorIds: string[]) {
    await this.findOne(tarefaId);

    return this.prisma.tarefa.update({
      where: { id: tarefaId },
      data: {
        observadores: {
          set: observadorIds.map((id) => ({ id })),
        },
      },
      include: {
        observadores: { select: { id: true, nome: true, email: true } },
        responsavel: { select: { id: true, nome: true, email: true } },
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

  async importarBitrix(fileBuffer: Buffer, projetoId: string | undefined, etapa?: string) {
    const htmlContent = fileBuffer.toString('utf-8');

    const tbodyMatch = htmlContent.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
    if (!tbodyMatch) {
      return { totalLinhas: 0, criadas: 0, atualizadas: 0, ignoradasDuplicadas: 0, usuariosCriados: [] };
    }

    const unescapeHtml = (html: string) => {
      return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim();
    };

    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let matchRow;
    const rows: string[][] = [];

    while ((matchRow = trRegex.exec(tbodyMatch[1])) !== null) {
      const tdsMatch = [...matchRow[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
      const tds = tdsMatch.map((m) => unescapeHtml(m[1]));
      if (tds.length >= 31) {
        rows.push(tds);
      }
    }

    const users = await this.prisma.user.findMany();
    const userMap = new Map<string, string>();
    users.forEach((u) => userMap.set(u.nome.trim().toLowerCase(), u.id));

    const parseDate = (dateStr: string) => {
      if (!dateStr) return null;
      const parts = dateStr.trim().split(/[\s/:]+/);
      if (parts.length >= 6) {
        return new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0]),
          parseInt(parts[3]),
          parseInt(parts[4]),
          parseInt(parts[5]),
        );
      }
      return null;
    };

    const usuariosCriados: string[] = [];
    const resolveUser = async (nomeStr: string) => {
      if (!nomeStr) return null;
      const nome = nomeStr.trim();
      const key = nome.toLowerCase();
      if (!key) return null;

      if (userMap.has(key)) {
        return userMap.get(key);
      }

      const hashSuffix = Math.random().toString(36).substring(2, 8);
      const slug = key.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const email = `${slug || 'user'}.bitrix${hashSuffix}@importado.vivox.local`;
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      try {
        const newUser = await this.prisma.user.create({
          data: {
            nome: nome,
            email: email,
            senha: hashedPassword,
            role: 'COLABORADOR',
          },
        });
        userMap.set(key, newUser.id);
        if (!usuariosCriados.includes(nome)) {
          usuariosCriados.push(nome);
        }
        return newUser.id;
      } catch (e: any) {
        if (e.code === 'P2002') {
          const existing = await this.prisma.user.findUnique({ where: { email } });
          if (existing) {
            userMap.set(key, existing.id);
            return existing.id;
          }
        }
        this.logger.error(`Error creating placeholder user ${nome}:`, e);
        return null;
      }
    };

    let totalLinhas = rows.length;
    let criadas = 0;
    let atualizadas = 0;
    let ignoradasDuplicadas = 0;

    for (const tds of rows) {
      try {
        const origemBitrixId = tds[0];
        if (!origemBitrixId) continue;

        const existing = await this.prisma.tarefa.findUnique({ where: { origemBitrixId } });
        if (existing) {
          // A tarefa já existe (mesmo origemBitrixId). Se o usuário escolheu uma
          // etapa de destino explicitamente, isso é um pedido de "mover" a tarefa
          // para este workspace/etapa, não apenas ignorar. Sem etapa, mantemos o
          // comportamento antigo de só ignorar duplicidade.
          if (etapa) {
            await this.prisma.tarefa.update({
              where: { origemBitrixId },
              data: {
                status: etapa,
                projetoId: projetoId || existing.projetoId,
              },
            });
            atualizadas++;
          } else {
            ignoradasDuplicadas++;
          }
          continue;
        }

        const titulo = tds[1] || 'Sem título';
        const descricao = tds[2] || '';
        const prazo = parseDate(tds[4]);
        const autorStr = tds[5];
        const responsavelStr = tds[6];
        const observadoresStr = tds[8];
        const statusStr = tds[9];

        // "Status" do Bitrix (Pendente/Em andamento/Concluída) não é a mesma coisa
        // que a etapa/coluna do Kanban aqui no Vivox. Quando o usuário escolhe uma
        // etapa de destino explicitamente, todas as linhas importadas vão para ela,
        // ignorando o texto de Status do Bitrix.
        let status: string;
        if (etapa) {
          status = etapa;
        } else {
          status = 'A_FAZER';
          if (statusStr === 'Concluída') status = 'CONCLUIDA';
          else if (statusStr === 'Em andamento') status = 'EM_ANDAMENTO';
          else if (statusStr === 'Pendente') status = 'A_FAZER';
        }

        const createdAt = parseDate(tds[11]) || new Date();
        const dataInicio = parseDate(tds[12]);
        const dataConclusao = parseDate(tds[14]);
        const tags = tds[20] ? tds[20].split(',').map((t) => t.trim()).filter((t) => t) : [];

        const autorId = await resolveUser(autorStr);
        const responsavelId = await resolveUser(responsavelStr);

        const observadoresIds: string[] = [];
        if (observadoresStr) {
          const obsNames = observadoresStr.split(',').map((n) => n.trim()).filter((n) => n);
          for (const obsName of obsNames) {
            const obsId = await resolveUser(obsName);
            if (obsId) {
              observadoresIds.push(obsId);
            }
          }
        }

        await this.prisma.tarefa.create({
          data: {
            origemBitrixId,
            titulo,
            descricao,
            prazo,
            status,
            createdAt,
            dataInicio,
            dataConclusao,
            tags,
            projetoId: projetoId || undefined,
            autorId: autorId || undefined,
            responsavelId: responsavelId || undefined,
            observadores:
              observadoresIds.length > 0
                ? {
                    connect: observadoresIds.map((id) => ({ id })),
                  }
                : undefined,
          },
        });

        criadas++;
      } catch (err) {
        this.logger.error(`Error processing bitrix row ${tds[0]}:`, err);
        ignoradasDuplicadas++;
      }
    }

    return {
      totalLinhas,
      criadas,
      atualizadas,
      ignoradasDuplicadas,
      usuariosCriados,
    };
  }

  // ============================================
  // EXPORTAR / IMPORTAR BACKUP DO WORKSPACE
  // (formato interno em JSON, com fidelidade total: etapa, status, dono etc.)
  // ============================================

  async exportarWorkspace(projetoId: string) {
    return this.prisma.tarefa.findMany({
      where: { projetoId },
      include: {
        responsavel: { select: { id: true, nome: true, email: true } },
        autor: { select: { id: true, nome: true, email: true } },
        observadores: { select: { id: true, nome: true, email: true } },
        checklist: {
          select: { titulo: true, concluido: true, ordem: true },
          orderBy: { ordem: 'asc' },
        },
      },
      orderBy: [{ ordem: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async importarBackup(tarefasExportadas: any[], projetoId: string) {
    if (!Array.isArray(tarefasExportadas)) {
      throw new BadRequestException('Arquivo de backup inválido: "tarefas" deve ser uma lista');
    }

    const PRIORIDADES_VALIDAS = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];
    const usuariosCriados: string[] = [];

    // Pré-carrega usuários/clientes/serviços existentes UMA vez só, em vez de
    // consultar por tarefa — com milhares de tarefas, N+1 consultas sequenciais
    // (uma por responsável/autor/observador/cliente/serviço, por linha) estourava
    // o timeout de proxy em produção (erro 524, que o navegador mostra como CORS
    // porque a resposta de timeout não tem os headers da aplicação).
    const [todosUsuarios, todosClientes, todosServicos] = await Promise.all([
      this.prisma.user.findMany({ select: { id: true, email: true } }),
      this.prisma.cliente.findMany({ select: { id: true } }),
      this.prisma.servicoContratado.findMany({ select: { id: true } }),
    ]);
    const idsUsuariosValidos = new Set(todosUsuarios.map((u) => u.id));
    const usuarioPorEmail = new Map(todosUsuarios.map((u) => [u.email.toLowerCase(), u.id]));
    const idsClientesValidos = new Set(todosClientes.map((c) => c.id));
    const idsServicosValidos = new Set(todosServicos.map((s) => s.id));

    // Evita duas tarefas do mesmo lote concorrente criarem, em paralelo, um
    // placeholder duplicado para o mesmo usuário ausente.
    const criacoesEmAndamento = new Map<string, Promise<string | null>>();

    const criarUsuarioPlaceholder = async (
      nome: string,
      email: string | undefined,
    ): Promise<string | null> => {
      const hashSuffix = Math.random().toString(36).substring(2, 8);
      const slug = nome.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const emailGerado = email || `${slug || 'user'}.backup${hashSuffix}@importado.vivox.local`;
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      try {
        const novo = await this.prisma.user.create({
          data: { nome, email: emailGerado, senha: hashedPassword, role: 'COLABORADOR' },
        });
        idsUsuariosValidos.add(novo.id);
        usuarioPorEmail.set(emailGerado, novo.id);
        if (!usuariosCriados.includes(nome)) usuariosCriados.push(nome);
        return novo.id;
      } catch (e: any) {
        if (e.code === 'P2002') {
          const existente = usuarioPorEmail.get(emailGerado);
          if (existente) return existente;
        }
        this.logger.error(`Erro criando usuário placeholder do backup: ${nome}`, e);
        return null;
      }
    };

    const resolveUsuario = async (
      ref: { id?: string; nome?: string; email?: string } | null | undefined,
    ): Promise<string | null> => {
      if (!ref) return null;

      // 1) Mesmo banco/instância: se o usuário original ainda existir, usa direto.
      if (ref.id && idsUsuariosValidos.has(ref.id)) return ref.id;

      // 2) Reconstrói por email, que é estável entre exportações.
      const email = ref.email?.trim().toLowerCase();
      if (email && usuarioPorEmail.has(email)) return usuarioPorEmail.get(email)!;

      // 3) Não existe mais em lugar nenhum: cria um usuário placeholder — mas só
      // uma vez por email, mesmo se várias tarefas do lote pedirem em paralelo.
      const nome = ref.nome?.trim() || email || 'Usuário importado';
      const chave = email || `nome:${nome}`;
      let criacao = criacoesEmAndamento.get(chave);
      if (!criacao) {
        criacao = criarUsuarioPlaceholder(nome, email);
        criacoesEmAndamento.set(chave, criacao);
      }
      return criacao;
    };

    let criadas = 0;
    let ignoradas = 0;

    const importarUmaTarefa = async (t: any) => {
      try {
        const responsavelId = await resolveUsuario(t?.responsavel);
        const autorId = await resolveUsuario(t?.autor);

        const observadoresIds: string[] = [];
        if (Array.isArray(t?.observadores)) {
          for (const obs of t.observadores) {
            const id = await resolveUsuario(obs);
            if (id) observadoresIds.push(id);
          }
        }

        // Cliente/serviço só são reaproveitados se ainda existirem neste banco
        // (mesma instância) — não é possível reconstruí-los apenas pelo id.
        const clienteId = t?.clienteId && idsClientesValidos.has(t.clienteId) ? t.clienteId : undefined;
        const servicoId = t?.servicoId && idsServicosValidos.has(t.servicoId) ? t.servicoId : undefined;

        const baseData = {
          titulo: t?.titulo || 'Sem título',
          descricao: t?.descricao || undefined,
          status: t?.status || 'A_FAZER',
          prioridade: PRIORIDADES_VALIDAS.includes(t?.prioridade) ? t.prioridade : 'MEDIA',
          prazo: t?.prazo ? new Date(t.prazo) : undefined,
          dataInicio: t?.dataInicio ? new Date(t.dataInicio) : undefined,
          dataConclusao: t?.dataConclusao ? new Date(t.dataConclusao) : undefined,
          horasEstimadas: typeof t?.horasEstimadas === 'number' ? t.horasEstimadas : undefined,
          horasGastas: typeof t?.horasGastas === 'number' ? t.horasGastas : undefined,
          tags: Array.isArray(t?.tags) ? t.tags : [],
          ordem: typeof t?.ordem === 'number' ? t.ordem : undefined,
          createdAt: t?.createdAt ? new Date(t.createdAt) : undefined,
          projetoId,
          clienteId,
          servicoId,
          responsavelId: responsavelId || undefined,
          autorId: autorId || undefined,
          observadores:
            observadoresIds.length > 0 ? { connect: observadoresIds.map((id) => ({ id })) } : undefined,
          checklist:
            Array.isArray(t?.checklist) && t.checklist.length > 0
              ? {
                  create: t.checklist.map((c: any, idx: number) => ({
                    titulo: c?.titulo || '',
                    concluido: Boolean(c?.concluido),
                    ordem: typeof c?.ordem === 'number' ? c.ordem : idx,
                  })),
                }
              : undefined,
        };

        try {
          await this.prisma.tarefa.create({
            data: { ...baseData, origemBitrixId: t?.origemBitrixId || undefined },
          });
        } catch (e: any) {
          // origemBitrixId ainda em uso (a tarefa original não foi apagada) —
          // recria mesmo assim, só que sem esse vínculo, para não perder a linha.
          if (e.code === 'P2002' && t?.origemBitrixId) {
            await this.prisma.tarefa.create({ data: baseData });
          } else {
            throw e;
          }
        }

        criadas++;
      } catch (err) {
        this.logger.error(`Erro ao importar tarefa do backup "${t?.titulo}":`, err);
        ignoradas++;
      }
    };

    // Processa em lotes concorrentes (em vez de um-a-um sequencial) pra manter
    // o tempo total baixo mesmo em workspaces com milhares de tarefas.
    const CONCORRENCIA = 15;
    for (let i = 0; i < tarefasExportadas.length; i += CONCORRENCIA) {
      const lote = tarefasExportadas.slice(i, i + CONCORRENCIA);
      await Promise.all(lote.map((t) => importarUmaTarefa(t)));
    }

    return { totalLinhas: tarefasExportadas.length, criadas, ignoradas, usuariosCriados };
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
