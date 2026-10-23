import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SalvarPropostaDto } from './proposta.dto';
import { criptografarLink, decifrarLink } from './proposta-link.crypto';

// Allowlist compartilhada: nunca incluir a relação Cliente no documento público.
const documentoSelect = {
  id: true,
  titulo: true,
  destinatario: true,
  apresentacao: true,
  validade: true,
  corDestaque: true,
  demo: true,
  secoes: true,
  updatedAt: true,
  createdAt: true,
} satisfies Prisma.PropostaSelect;

@Injectable()
export class PropostasService {
  constructor(private readonly prisma: PrismaService) {}

  private async cliente(clienteId: string) {
    if (
      !(await this.prisma.cliente.findUnique({
        where: { id: clienteId },
        select: { id: true },
      }))
    ) {
      throw new NotFoundException('Cliente não encontrado.');
    }
  }

  async listar(clienteId: string) {
    await this.cliente(clienteId);
    const propostas = await this.prisma.proposta.findMany({
      where: { clienteId },
      orderBy: { createdAt: 'desc' },
      select: { ...documentoSelect, createdAt: true, linkHash: true },
    });
    return propostas.map(({ linkHash, ...proposta }) => ({
      ...proposta,
      compartilhada: !!linkHash,
    }));
  }

  private dados(dto: SalvarPropostaDto) {
    return {
      titulo: dto.titulo.trim(),
      destinatario: dto.destinatario.trim(),
      apresentacao: dto.apresentacao,
      corDestaque: dto.corDestaque,
      demo: dto.demo ?? null,
      validade: dto.validade ? new Date(`${dto.validade}T00:00:00.000Z`) : null,
      secoes: dto.secoes.map(({ titulo, texto, html }) => ({
        titulo,
        texto,
        ...(html !== undefined ? { html } : {}),
      })) as Prisma.InputJsonValue,
    };
  }

  async criar(clienteId: string, dto: SalvarPropostaDto) {
    await this.cliente(clienteId);
    return this.prisma.proposta.create({
      data: { clienteId, ...this.dados(dto) },
      select: documentoSelect,
    });
  }

  private async existe(clienteId: string, id: string) {
    if (
      !(await this.prisma.proposta.findFirst({
        where: { id, clienteId },
        select: { id: true },
      }))
    ) {
      throw new NotFoundException('Proposta não encontrada.');
    }
  }

  async editar(clienteId: string, id: string, dto: SalvarPropostaDto) {
    await this.existe(clienteId, id);
    return this.prisma.proposta.update({
      where: { id, clienteId },
      data: this.dados(dto),
      select: documentoSelect,
    });
  }

  async excluir(clienteId: string, id: string) {
    await this.existe(clienteId, id);
    await this.prisma.proposta.delete({ where: { id, clienteId } });
    return { excluida: true };
  }

  async compartilhar(clienteId: string, id: string) {
    await this.existe(clienteId, id);
    const token = randomBytes(32).toString('hex');
    await this.prisma.proposta.update({
      where: { id, clienteId },
      data: { linkHash: this.hash(token), linkTokenCriptografado: criptografarLink(token) },
      select: { id: true },
    });
    return { token };
  }

  async linkAtivo(clienteId: string, id: string) {
    const proposta = await this.prisma.proposta.findFirst({
      where: { id, clienteId },
      select: { linkHash: true, linkTokenCriptografado: true },
    });
    if (!proposta) throw new NotFoundException('Proposta não encontrada.');
    if (!proposta.linkHash || !proposta.linkTokenCriptografado) return { token: null };
    const token = decifrarLink(proposta.linkTokenCriptografado);
    if (this.hash(token) !== proposta.linkHash) throw new NotFoundException('Link indisponível. Gere um novo link para esta proposta.');
    return { token };
  }

  async revogar(clienteId: string, id: string) {
    await this.existe(clienteId, id);
    await this.prisma.proposta.update({
      where: { id, clienteId },
      data: { linkHash: null, linkTokenCriptografado: null },
      select: { id: true },
    });
    return { compartilhada: false };
  }

  private hash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  async publica(token: string) {
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new NotFoundException('Proposta indisponível.');
    const proposta = await this.prisma.proposta.findUnique({
      where: { linkHash: this.hash(token) },
      select: documentoSelect,
    });
    if (!proposta) throw new NotFoundException('Proposta indisponível.');
    return proposta;
  }
}
