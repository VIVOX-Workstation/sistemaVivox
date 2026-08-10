import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoEventoHistorico, StatusPlanejamento } from '@prisma/client';
import {
  CreatePlanejamentoDto,
  UpdatePlanejamentoDto,
  EscopoItemDto,
  CreateMarcoDto,
  UpdateMarcoDto,
  CreateReferenciaDto,
  CreateNotaHistoricoDto
} from './dto/planejamento.dto';

@Injectable()
export class PlanejamentoServicoService {
  constructor(private readonly prisma: PrismaService) {}

  private async registrarHistorico(
    planejamentoServicoId: string,
    tipoEvento: TipoEventoHistorico,
    descricao: string,
    autorId: string,
    valorAnterior?: string,
    valorNovo?: string,
  ) {
    await this.prisma.historicoServico.create({
      data: {
        planejamentoServicoId,
        tipoEvento,
        descricao,
        autorId,
        valorAnterior,
        valorNovo,
      },
    });
  }

  async getPlanejamentoByServico(servicoContratadoId: string) {
    const planejamento = await this.prisma.planejamentoServico.findUnique({
      where: { servicoContratadoId },
      include: {
        responsaveis: { select: { id: true, nome: true, email: true } },
        escopoItens: { orderBy: { ordem: 'asc' } },
        marcos: { orderBy: { dataPrevista: 'asc' } },
        referencias: true,
        historico: {
          orderBy: { data: 'desc' },
          include: { autor: { select: { id: true, nome: true } } },
        },
        servicoContratado: {
          select: {
            tipoServico: true,
            status: true,
            cliente: { select: { id: true, nomeFantasia: true } }
          }
        }
      },
    });

    return planejamento;
  }

  async createPlanejamento(dto: CreatePlanejamentoDto, userId: string) {
    // Check if exists
    const existing = await this.prisma.planejamentoServico.findUnique({
      where: { servicoContratadoId: dto.servicoContratadoId },
    });

    if (existing) {
      throw new Error('Planejamento já existe para este serviço');
    }

    const planejamento = await this.prisma.planejamentoServico.create({
      data: {
        servicoContratadoId: dto.servicoContratadoId,
        ideiaBriefing: dto.ideiaBriefing,
        statusGeral: dto.statusGeral || StatusPlanejamento.BRIEFING,
        prazoEntrega: dto.prazoEntrega ? new Date(dto.prazoEntrega) : null,
        responsaveis: {
          connect: dto.responsaveisIds?.map((id) => ({ id })) || [],
        },
        escopoItens: {
          create: dto.escopoInicial?.map((item, index) => ({
            titulo: item.titulo,
            descricao: item.descricao,
            status: item.status,
            ordem: item.ordem ?? index,
          })) || [],
        },
      },
    });

    await this.registrarHistorico(
      planejamento.id,
      TipoEventoHistorico.CRIACAO,
      'Planejamento do serviço iniciado.',
      userId,
    );

    return planejamento;
  }

  async updatePlanejamento(id: string, dto: UpdatePlanejamentoDto, userId: string) {
    const old = await this.prisma.planejamentoServico.findUnique({
      where: { id },
      include: { responsaveis: true },
    });

    if (!old) throw new NotFoundException('Planejamento não encontrado');

    const updated = await this.prisma.planejamentoServico.update({
      where: { id },
      data: {
        ideiaBriefing: dto.ideiaBriefing,
        statusGeral: dto.statusGeral,
        prazoEntrega: dto.prazoEntrega ? new Date(dto.prazoEntrega) : undefined,
        flowNodes: dto.flowNodes !== undefined ? dto.flowNodes : undefined,
        flowEdges: dto.flowEdges !== undefined ? dto.flowEdges : undefined,
        responsaveis: dto.responsaveisIds
          ? { set: dto.responsaveisIds.map((rid) => ({ id: rid })) }
          : undefined,
      },
    });

    // Registrar histórico se status mudou
    if (dto.statusGeral && dto.statusGeral !== old.statusGeral) {
      await this.registrarHistorico(
        id,
        TipoEventoHistorico.STATUS_ALTERADO,
        `Status geral alterado para ${dto.statusGeral}`,
        userId,
        old.statusGeral,
        dto.statusGeral,
      );
    }

    // Registrar histórico se prazo mudou
    if (dto.prazoEntrega && new Date(dto.prazoEntrega).toISOString() !== old.prazoEntrega?.toISOString()) {
      await this.registrarHistorico(
        id,
        TipoEventoHistorico.PRAZO_ALTERADO,
        'Prazo de entrega alterado.',
        userId,
        old.prazoEntrega?.toISOString(),
        dto.prazoEntrega,
      );
    }
    
    // Registrar histórico se responsáveis mudaram (simplificado)
    if (dto.responsaveisIds) {
      const oldIds = old.responsaveis.map(r => r.id).sort().join(',');
      const newIds = dto.responsaveisIds.slice().sort().join(',');
      if (oldIds !== newIds) {
         await this.registrarHistorico(
          id,
          TipoEventoHistorico.RESPONSAVEL_ALTERADO,
          'Equipe responsável atualizada.',
          userId,
        );
      }
    }

    return updated;
  }

  // --- Escopo ---
  async addEscopoItem(planejamentoId: string, dto: EscopoItemDto, userId: string) {
    const count = await this.prisma.escopoItem.count({ where: { planejamentoServicoId: planejamentoId } });
    const item = await this.prisma.escopoItem.create({
      data: {
        planejamentoServicoId: planejamentoId,
        titulo: dto.titulo,
        descricao: dto.descricao,
        status: dto.status,
        ordem: dto.ordem ?? count,
      },
    });

    await this.registrarHistorico(
      planejamentoId,
      TipoEventoHistorico.ESCOPO_ALTERADO,
      `Item "${dto.titulo}" adicionado ao escopo.`,
      userId,
    );
    return item;
  }

  async updateEscopoItem(itemId: string, dto: EscopoItemDto, userId: string) {
    const oldItem = await this.prisma.escopoItem.findUnique({ where: { id: itemId } });
    if (!oldItem) throw new NotFoundException();

    const updated = await this.prisma.escopoItem.update({
      where: { id: itemId },
      data: {
        titulo: dto.titulo,
        descricao: dto.descricao,
        status: dto.status,
        ordem: dto.ordem,
      },
    });

    let mudancas: string[] = [];
    if (dto.status && dto.status !== oldItem.status) mudancas.push(`status para ${dto.status}`);
    
    if (mudancas.length > 0) {
      await this.registrarHistorico(
        updated.planejamentoServicoId,
        TipoEventoHistorico.ESCOPO_ALTERADO,
        `Item "${updated.titulo}" atualizado: ${mudancas.join(', ')}.`,
        userId,
      );
    }

    return updated;
  }

  async deleteEscopoItem(itemId: string, userId: string) {
    const item = await this.prisma.escopoItem.delete({ where: { id: itemId } });
    await this.registrarHistorico(
      item.planejamentoServicoId,
      TipoEventoHistorico.ESCOPO_ALTERADO,
      `Item "${item.titulo}" removido do escopo.`,
      userId,
    );
    return item;
  }

  // --- Marcos ---
  async addMarco(planejamentoId: string, dto: CreateMarcoDto, userId: string) {
    const item = await this.prisma.marco.create({
      data: {
        planejamentoServicoId: planejamentoId,
        titulo: dto.titulo,
        dataInicio: dto.dataInicio ? new Date(dto.dataInicio) : null,
        dataPrevista: new Date(dto.dataPrevista),
        dependeDeId: dto.dependeDeId || null,
        dataRealizada: dto.dataRealizada ? new Date(dto.dataRealizada) : null,
        status: dto.status,
      },
    });

    await this.registrarHistorico(
      planejamentoId,
      TipoEventoHistorico.PRAZO_ALTERADO, // Pode ser outro tipo se quiser
      `Marco "${dto.titulo}" adicionado (previsto: ${dto.dataPrevista}).`,
      userId,
    );
    return item;
  }

  async updateMarco(marcoId: string, dto: UpdateMarcoDto, userId: string) {
    const old = await this.prisma.marco.findUnique({ where: { id: marcoId } });
    if (!old) throw new NotFoundException();

    const updated = await this.prisma.marco.update({
      where: { id: marcoId },
      data: {
        ...(dto.titulo !== undefined && { titulo: dto.titulo }),
        ...(dto.dataInicio !== undefined && { dataInicio: dto.dataInicio ? new Date(dto.dataInicio) : null }),
        ...(dto.dataPrevista !== undefined && { dataPrevista: new Date(dto.dataPrevista) }),
        ...(dto.dataRealizada !== undefined && { dataRealizada: dto.dataRealizada ? new Date(dto.dataRealizada) : null }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.dependeDeId !== undefined && { dependeDeId: dto.dependeDeId }),
      },
    });

    if (dto.status === 'CONCLUIDO' && old.status !== 'CONCLUIDO') {
      await this.registrarHistorico(
        updated.planejamentoServicoId,
        TipoEventoHistorico.MARCO_CONCLUIDO,
        `Marco "${updated.titulo}" concluído.`,
        userId,
      );
    } else if (dto.status && dto.status !== old.status) {
       await this.registrarHistorico(
        updated.planejamentoServicoId,
        TipoEventoHistorico.STATUS_ALTERADO,
        `Status do marco "${updated.titulo}" alterado para ${dto.status}.`,
        userId,
      );
    }

    return updated;
  }

  async deleteMarco(marcoId: string, userId: string) {
     const item = await this.prisma.marco.delete({ where: { id: marcoId } });
     await this.registrarHistorico(
      item.planejamentoServicoId,
      TipoEventoHistorico.PRAZO_ALTERADO,
      `Marco "${item.titulo}" removido.`,
      userId,
    );
    return item;
  }

  // --- Historico ---
  async addNotaHistorico(planejamentoId: string, dto: CreateNotaHistoricoDto, userId: string) {
    return this.prisma.historicoServico.create({
      data: {
        planejamentoServicoId: planejamentoId,
        tipoEvento: TipoEventoHistorico.NOTA_MANUAL,
        descricao: dto.descricao,
        autorId: userId,
      },
      include: {
        autor: { select: { id: true, nome: true } }
      }
    });
  }
}
