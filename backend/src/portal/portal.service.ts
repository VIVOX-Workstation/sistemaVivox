import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, StatusInteresse, StatusServico, TipoServico } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInteresseDto } from './dto/create-interesse.dto';
import { decryptPortalPassword, encryptPortalPassword, generatePortalPassword } from './portal-crypto';
import { SERVICOS_PORTAL } from './servicos-portal.constants';

@Injectable()
export class PortalService {
  constructor(private readonly prisma: PrismaService) {}

  async criarAcesso(clienteId: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { nomeFantasia: true, usuarioPortal: true },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado.');
    if (cliente.usuarioPortal) return this.acessoExistente(cliente.usuarioPortal);

    const senha = generatePortalPassword();
    const senhaPortalCriptografada = encryptPortalPassword(senha);
    const hashedPassword = await bcrypt.hash(senha, 10);
    const slug = cliente.nomeFantasia.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'cliente';

    for (let suffix = 1; ; suffix++) {
      const email = `${slug}${suffix === 1 ? '' : `-${suffix}`}@cliente.vivox`;
      try {
        await this.prisma.user.create({
          data: { nome: cliente.nomeFantasia, email, senha: hashedPassword, role: Role.CLIENTE, clienteId, senhaPortalCriptografada },
        });
        return { login: email, senha, criadoAgora: true };
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
        // Outra requisição pode ter criado o acesso deste cliente enquanto gerávamos a senha.
        const existing = await this.prisma.user.findUnique({ where: { clienteId } });
        if (existing) return this.acessoExistente(existing);
        // A colisão restante é o login: tenta o próximo sufixo.
      }
    }
  }

  private acessoExistente(user: { email: string; senhaPortalCriptografada: string | null }) {
    return { login: user.email, senha: decryptPortalPassword(user.senhaPortalCriptografada), criadoAgora: false };
  }

  async redefinirSenha(clienteId: string) {
    const user = await this.prisma.user.findUnique({ where: { clienteId } });
    if (!user) throw new NotFoundException('Acesso ao portal não encontrado.');
    const senha = generatePortalPassword();
    const senhaPortalCriptografada = encryptPortalPassword(senha);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { senha: await bcrypt.hash(senha, 10), senhaPortalCriptografada },
    });
    return { login: user.email, senha, criadoAgora: false };
  }

  async listarInteresses(clienteId: string) {
    await this.exigirCliente(clienteId);
    const interesses = await this.prisma.interesseServico.findMany({
      where: { clienteId }, orderBy: { createdAt: 'desc' },
      select: { id: true, tipoServico: true, status: true, mensagem: true, createdAt: true },
    });
    return interesses.map((interesse) => ({ ...interesse, label: SERVICOS_PORTAL[interesse.tipoServico].label }));
  }

  private async exigirCliente(clienteId: string) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: clienteId }, select: { id: true } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado.');
  }

  async mapaServicos(clienteId: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true, nomeFantasia: true, logoUrl: true,
        // Serviço cancelado volta a ser "disponível para desbloquear"
        servicosContratados: {
          where: { status: { not: StatusServico.CANCELADO } },
          orderBy: [{ dataContratacao: 'desc' }, { createdAt: 'desc' }],
          select: { tipoServico: true, status: true, dataContratacao: true },
        },
        interessesServico: { select: { tipoServico: true } },
      },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado.');
    const servicos = Object.values(TipoServico).map((tipoServico) => {
      const contratado = cliente.servicosContratados.find((servico) => servico.tipoServico === tipoServico);
      return {
        tipoServico, ...SERVICOS_PORTAL[tipoServico], contratado: !!contratado,
        status: contratado?.status ?? null,
        dataContratacao: contratado?.dataContratacao.toISOString() ?? null,
        interesseRegistrado: cliente.interessesServico.some((interesse) => interesse.tipoServico === tipoServico),
      };
    }).sort((a, b) => Number(b.contratado) - Number(a.contratado));
    return { cliente: { id: cliente.id, nomeFantasia: cliente.nomeFantasia, logoUrl: cliente.logoUrl }, servicos };
  }

  async registrarInteresse(clienteId: string, dto: CreateInteresseDto) {
    await this.exigirCliente(clienteId);
    const contratado = await this.prisma.servicoContratado.findFirst({
      where: { clienteId, tipoServico: dto.tipoServico, status: { not: StatusServico.CANCELADO } }, select: { id: true },
    });
    if (contratado) throw new BadRequestException('Este serviço já está contratado.');
    return this.prisma.interesseServico.upsert({
      where: { clienteId_tipoServico: { clienteId, tipoServico: dto.tipoServico } },
      create: { clienteId, tipoServico: dto.tipoServico, mensagem: dto.mensagem ?? null, status: StatusInteresse.NOVO },
      update: { mensagem: dto.mensagem ?? null, status: StatusInteresse.NOVO },
    });
  }
}
