import { BadRequestException, Injectable, Logger, NotFoundException, StreamableFile } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { EnviarCronogramaDto } from './dto/enviar-cronograma.dto';

export const CRONOGRAMA_MAX_BYTES = 20 * 1024 * 1024;

const CRONOGRAMA_SELECT = {
  id: true, titulo: true, ano: true, mes: true, nomeArquivo: true, tamanho: true, createdAt: true,
  enviadoPor: { select: { id: true, nome: true } },
} satisfies Prisma.CronogramaClienteSelect;

/** Resposta do PDF para abrir no navegador (inline), com nome UTF-8 */
export function respostaPdf({ stream, contentLength, nomeArquivo }: { stream: Readable; contentLength?: number; nomeArquivo: string }) {
  return new StreamableFile(stream, {
    type: 'application/pdf',
    disposition: `inline; filename*=UTF-8''${encodeURIComponent(nomeArquivo)}`,
    length: contentLength,
  });
}

// Cabeçalho de todo PDF; evita aceitar outro arquivo renomeado para .pdf
const ehPdf = (buffer: Buffer) => buffer.subarray(0, 5).toString('latin1') === '%PDF-';

@Injectable()
export class CronogramasService {
  private readonly logger = new Logger(CronogramasService.name);

  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService) {}

  private async exigirCliente(clienteId: string) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: clienteId }, select: { id: true } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado.');
  }

  async listar(clienteId: string, comAutor = true) {
    await this.exigirCliente(clienteId);
    const itens = await this.prisma.cronogramaCliente.findMany({
      where: { clienteId },
      orderBy: { createdAt: 'desc' },
      select: CRONOGRAMA_SELECT,
    });
    // O cliente no portal não precisa saber quem da equipe enviou
    return comAutor ? itens : itens.map(({ enviadoPor, ...resto }) => resto);
  }

  async enviar(clienteId: string, arquivo: Express.Multer.File | undefined, dto: EnviarCronogramaDto, usuarioId?: string) {
    if (!arquivo) throw new BadRequestException('Envie o arquivo PDF no campo "arquivo".');
    if (arquivo.size > CRONOGRAMA_MAX_BYTES) throw new BadRequestException('O PDF pode ter no máximo 20 MB.');
    if (!ehPdf(arquivo.buffer)) throw new BadRequestException('O arquivo precisa ser um PDF.');
    if ((dto.ano === undefined) !== (dto.mes === undefined)) {
      throw new BadRequestException('Informe mês e ano de referência juntos, ou nenhum dos dois.');
    }
    await this.exigirCliente(clienteId);

    const arquivoKey = `cronogramas/${clienteId}/${randomUUID()}.pdf`;
    await this.storage.uploadRawFile(arquivoKey, arquivo.buffer, 'application/pdf');
    try {
      return await this.prisma.cronogramaCliente.create({
        data: {
          clienteId,
          titulo: dto.titulo,
          ano: dto.ano ?? null,
          mes: dto.mes ?? null,
          arquivoKey,
          // multer entrega o nome em latin1; converte para não estragar acentos
          nomeArquivo: Buffer.from(arquivo.originalname, 'latin1').toString('utf8'),
          tamanho: arquivo.size,
          enviadoPorId: usuarioId ?? null,
        },
        select: CRONOGRAMA_SELECT,
      });
    } catch (error) {
      await this.storage.deleteFile(arquivoKey).catch(() => undefined);
      throw error;
    }
  }

  /** clienteId restringe ao dono (portal); sem ele, a equipe acessa qualquer cronograma */
  async arquivo(id: string, clienteId?: string) {
    const cronograma = await this.prisma.cronogramaCliente.findUnique({
      where: { id }, select: { clienteId: true, arquivoKey: true, nomeArquivo: true },
    });
    // 404 também quando é de outro cliente, para não revelar que o id existe
    if (!cronograma || (clienteId && cronograma.clienteId !== clienteId)) {
      throw new NotFoundException('Cronograma não encontrado.');
    }
    const { stream, contentLength } = await this.storage.getFileStream(cronograma.arquivoKey);
    return { stream, contentLength, nomeArquivo: cronograma.nomeArquivo };
  }

  async remover(id: string) {
    const cronograma = await this.prisma.cronogramaCliente.findUnique({ where: { id }, select: { arquivoKey: true } });
    if (!cronograma) throw new NotFoundException('Cronograma não encontrado.');
    await this.prisma.cronogramaCliente.delete({ where: { id } });
    // Se o storage falhar, o registro já saiu: só registra, sem travar a exclusão
    await this.storage.deleteFile(cronograma.arquivoKey).catch((err) =>
      this.logger.warn(`Não foi possível apagar ${cronograma.arquivoKey} do storage: ${err}`),
    );
    return { ok: true };
  }
}
