import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ehPdf } from '../acompanhamento/cronogramas.service';
import { SalvarPropostaDto, SalvarPropostaPdfDto } from './proposta.dto';
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
  formato: true,
  nomeArquivo: true,
  tamanho: true,
  secoes: true,
  updatedAt: true,
  createdAt: true,
} satisfies Prisma.PropostaSelect;

export const PROPOSTA_PDF_MAX_BYTES = 30 * 1024 * 1024;

@Injectable()
export class PropostasService {
  private readonly logger = new Logger(PropostasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

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
      select: { ...documentoSelect, linkHash: true, criadoPor: { select: { nome: true } } },
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

  async criar(clienteId: string, dto: SalvarPropostaDto, usuarioId?: string) {
    await this.cliente(clienteId);
    return this.prisma.proposta.create({
      data: { clienteId, ...this.dados(dto), ...(usuarioId ? { criadoPorId: usuarioId } : {}) },
      select: documentoSelect,
    });
  }

  private async existe(clienteId: string, id: string, formato?: 'documento' | 'pdf') {
    const proposta = await this.prisma.proposta.findFirst({
      where: { id, clienteId },
      select: { id: true, formato: true, arquivoKey: true },
    });
    if (!proposta) throw new NotFoundException('Proposta não encontrada.');
    // Registro antigo sem formato conta como documento.
    if (formato && (proposta.formato ?? 'documento') !== formato) {
      throw new BadRequestException(
        formato === 'pdf' ? 'Esta proposta não é um PDF.' : 'Propostas em PDF são editadas pelo envio do arquivo.',
      );
    }
    return proposta;
  }

  async editar(clienteId: string, id: string, dto: SalvarPropostaDto) {
    await this.existe(clienteId, id, 'documento');
    return this.prisma.proposta.update({
      where: { id, clienteId },
      data: this.dados(dto),
      select: documentoSelect,
    });
  }

  async excluir(clienteId: string, id: string) {
    const { arquivoKey } = await this.existe(clienteId, id);
    await this.prisma.proposta.delete({ where: { id, clienteId } });
    if (arquivoKey) await this.apagarArquivo(arquivoKey);
    return { excluida: true };
  }

  // ---- Proposta em PDF ----

  private validarPdf(arquivo: Express.Multer.File) {
    if (arquivo.size > PROPOSTA_PDF_MAX_BYTES) throw new BadRequestException('O PDF pode ter no máximo 30 MB.');
    if (!ehPdf(arquivo.buffer)) throw new BadRequestException('O arquivo precisa ser um PDF.');
  }

  private dadosPdf(dto: SalvarPropostaPdfDto) {
    return {
      titulo: dto.titulo,
      destinatario: dto.destinatario,
      apresentacao: dto.apresentacao ?? '',
      validade: dto.validade ? new Date(`${dto.validade}T00:00:00.000Z`) : null,
      ...(dto.corDestaque ? { corDestaque: dto.corDestaque } : {}),
    };
  }

  private async guardarPdf(clienteId: string, arquivo: Express.Multer.File) {
    const arquivoKey = `propostas/${clienteId}/${randomUUID()}.pdf`;
    await this.storage.uploadRawFile(arquivoKey, arquivo.buffer, 'application/pdf');
    return {
      arquivoKey,
      // multer entrega o nome em latin1; converte para não estragar acentos
      nomeArquivo: Buffer.from(arquivo.originalname, 'latin1').toString('utf8'),
      tamanho: arquivo.size,
    };
  }

  private async apagarArquivo(arquivoKey: string) {
    // Se o storage falhar, o registro já mudou: só registra, sem travar a operação
    await this.storage.deleteFile(arquivoKey).catch((err) =>
      this.logger.warn(`Não foi possível apagar ${arquivoKey} do storage: ${err}`),
    );
  }

  async criarPdf(clienteId: string, arquivo: Express.Multer.File | undefined, dto: SalvarPropostaPdfDto, usuarioId?: string) {
    if (!arquivo) throw new BadRequestException('Envie o PDF da proposta no campo "arquivo".');
    this.validarPdf(arquivo);
    await this.cliente(clienteId);
    const pdf = await this.guardarPdf(clienteId, arquivo);
    try {
      return await this.prisma.proposta.create({
        data: {
          clienteId,
          ...this.dadosPdf(dto),
          ...pdf,
          formato: 'pdf',
          secoes: [],
          criadoPorId: usuarioId ?? null,
        },
        select: documentoSelect,
      });
    } catch (error) {
      await this.apagarArquivo(pdf.arquivoKey);
      throw error;
    }
  }

  /** Atualiza os dados; com arquivo novo, troca o PDF e apaga o anterior. */
  async editarPdf(clienteId: string, id: string, arquivo: Express.Multer.File | undefined, dto: SalvarPropostaPdfDto) {
    const atual = await this.existe(clienteId, id, 'pdf');
    if (arquivo) this.validarPdf(arquivo);
    const pdf = arquivo ? await this.guardarPdf(clienteId, arquivo) : null;
    try {
      const proposta = await this.prisma.proposta.update({
        where: { id, clienteId },
        data: { ...this.dadosPdf(dto), ...(pdf ?? {}) },
        select: documentoSelect,
      });
      if (pdf && atual.arquivoKey) await this.apagarArquivo(atual.arquivoKey);
      return proposta;
    } catch (error) {
      if (pdf) await this.apagarArquivo(pdf.arquivoKey);
      throw error;
    }
  }

  private async lerArquivo(proposta: { arquivoKey: string | null; nomeArquivo: string | null } | null) {
    if (!proposta?.arquivoKey) throw new NotFoundException('Arquivo da proposta não encontrado.');
    const { stream, contentLength } = await this.storage.getFileStream(proposta.arquivoKey);
    return { stream, contentLength, nomeArquivo: proposta.nomeArquivo || 'proposta.pdf' };
  }

  async arquivo(clienteId: string, id: string) {
    return this.lerArquivo(
      await this.prisma.proposta.findFirst({ where: { id, clienteId }, select: { arquivoKey: true, nomeArquivo: true } }),
    );
  }

  /** PDF pelo link público; o guard já validou o token. */
  async arquivoPublico(token: string) {
    return this.lerArquivo(
      await this.prisma.proposta.findUnique({ where: { linkHash: this.hash(token) }, select: { arquivoKey: true, nomeArquivo: true } }),
    );
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
