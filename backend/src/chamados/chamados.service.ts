import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TarefasService } from '../tarefas/tarefas.service';
import { CreateChamadoDto } from './dto/create-chamado.dto';
import { UpdateChamadoDto } from './dto/update-chamado.dto';
import { StatusChamado } from '@prisma/client';

const CHAMADO_INCLUDE = {
  cliente: { select: { id: true, nomeFantasia: true } },
  servico: { select: { id: true, tipoServico: true, status: true } },
  tarefa: {
    include: {
      responsavel: { select: { id: true, nome: true, email: true } },
    },
  },
  proprietario: { select: { id: true, nome: true, email: true } },
};

@Injectable()
export class ChamadosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tarefasService: TarefasService,
  ) {}

  async findAll(params: { clienteId?: string; servicoId?: string; status?: StatusChamado }) {
    const { clienteId, servicoId, status } = params;
    const where: any = {};
    if (clienteId) where.clienteId = clienteId;
    if (servicoId) where.servicoId = servicoId;
    if (status) where.status = status;

    return this.prisma.chamado.findMany({
      where,
      include: CHAMADO_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const chamado = await this.prisma.chamado.findUnique({
      where: { id },
      include: CHAMADO_INCLUDE,
    });
    if (!chamado) throw new NotFoundException('Chamado não encontrado');
    return chamado;
  }

  async create(dto: CreateChamadoDto, autorId?: string) {
    const tarefa = await this.tarefasService.create(
      {
        titulo: `🐛 Chamado: ${dto.itemTitulo || 'Suporte pós-entrega'}`,
        descricao: dto.descricaoProblema,
        prioridade: 'URGENTE',
        status: 'A_FAZER',
        tags: ['chamado'],
        clienteId: dto.clienteId,
        servicoId: dto.servicoId,
      },
      autorId,
    );

    const chamado = await this.prisma.chamado.create({
      data: {
        clienteId: dto.clienteId,
        servicoId: dto.servicoId,
        itemPlanejadoId: dto.itemPlanejadoId,
        itemTitulo: dto.itemTitulo,
        descricaoProblema: dto.descricaoProblema,
        tarefaId: tarefa.id,
        proprietarioId: autorId, // O criador é o proprietário inicial caso seja usuário interno
      },
      include: CHAMADO_INCLUDE,
    });

    if (autorId) {
      await this.prisma.chamadoComentario.create({
        data: {
          chamadoId: chamado.id,
          autorId,
          texto: 'Chamado criado.',
          isSystemMessage: true,
        },
      });
    }

    return chamado;
  }

  async update(id: string, dto: UpdateChamadoDto, autorId?: string) {
    const chamadoAntigo = await this.findOne(id);

    const data: any = { ...dto };
    if (dto.status === 'RESOLVIDO') {
      data.resolvidoEm = new Date();
    } else if (dto.status) {
      data.resolvidoEm = null;
    }

    const chamado = await this.prisma.chamado.update({
      where: { id },
      data,
      include: CHAMADO_INCLUDE,
    });

    // Registrar atividades de sistema
    if (dto.status && dto.status !== chamadoAntigo.status) {
      const statusLabels = {
        ABERTO: 'Aberto',
        EM_ANDAMENTO: 'Em Atendimento',
        RESOLVIDO: 'Resolvido',
      };
      
      await this.prisma.chamadoComentario.create({
        data: {
          chamadoId: id,
          autorId,
          texto: `Status alterado para ${statusLabels[dto.status]}`,
          isSystemMessage: true,
        },
      });
    }

    if (dto.proprietarioId !== undefined && dto.proprietarioId !== chamadoAntigo.proprietarioId) {
      const proprietario = dto.proprietarioId 
        ? await this.prisma.user.findUnique({ where: { id: dto.proprietarioId } })
        : null;
        
      const nomeProprietario = proprietario ? proprietario.nome : 'Nenhum';
      
      await this.prisma.chamadoComentario.create({
        data: {
          chamadoId: id,
          autorId,
          texto: `Proprietário alterado para ${nomeProprietario}`,
          isSystemMessage: true,
        },
      });
    }

    return chamado;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.chamado.delete({ where: { id } });
  }

  // --- Comentários ---

  async getComentarios(chamadoId: string) {
    return this.prisma.chamadoComentario.findMany({
      where: { chamadoId },
      include: {
        autor: { select: { id: true, nome: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addComentario(chamadoId: string, texto: string, autorId?: string) {
    return this.prisma.chamadoComentario.create({
      data: {
        chamadoId,
        texto,
        autorId,
        isSystemMessage: false,
      },
      include: {
        autor: { select: { id: true, nome: true, email: true } },
      },
    });
  }
}
