import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CRONOGRAMA_MAX_BYTES, CronogramasService } from './cronogramas.service';

jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

describe('CronogramasService', () => {
  const prisma = {
    cliente: { findUnique: jest.fn() },
    cronogramaCliente: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
  };
  const storage = { uploadRawFile: jest.fn(), getFileStream: jest.fn(), deleteFile: jest.fn() };
  const service = new CronogramasService(prisma as unknown as PrismaService, storage as unknown as StorageService);
  const pdf = (extra: Partial<Express.Multer.File> = {}) =>
    ({ buffer: Buffer.from('%PDF-1.7 conteudo'), size: 1000, originalname: 'cronograma.pdf', ...extra }) as Express.Multer.File;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.cliente.findUnique.mockResolvedValue({ id: 'c1' });
    storage.deleteFile.mockResolvedValue(undefined);
  });

  it('recusa arquivo que não é PDF, mesmo com nome .pdf, sem enviar ao storage', async () => {
    await expect(service.enviar('c1', pdf({ buffer: Buffer.from('<html>') }), { titulo: 'X' })).rejects.toThrow(BadRequestException);
    expect(storage.uploadRawFile).not.toHaveBeenCalled();
  });

  it('recusa arquivo ausente, acima de 20 MB e mês sem ano', async () => {
    await expect(service.enviar('c1', undefined, { titulo: 'X' })).rejects.toThrow(BadRequestException);
    await expect(service.enviar('c1', pdf({ size: CRONOGRAMA_MAX_BYTES + 1 }), { titulo: 'X' })).rejects.toThrow(BadRequestException);
    await expect(service.enviar('c1', pdf(), { titulo: 'X', mes: 3 })).rejects.toThrow(BadRequestException);
    expect(storage.uploadRawFile).not.toHaveBeenCalled();
  });

  it('salva no prefixo do cliente e apaga do storage se o banco falhar', async () => {
    prisma.cronogramaCliente.create.mockRejectedValue(new Error('db'));
    await expect(service.enviar('c1', pdf(), { titulo: 'Março', ano: 2025, mes: 3 }, 'u1')).rejects.toThrow('db');
    const key = storage.uploadRawFile.mock.calls[0][0];
    expect(key).toMatch(/^cronogramas\/c1\/[0-9a-f-]{36}\.pdf$/);
    expect(storage.deleteFile).toHaveBeenCalledWith(key);
  });

  it('no portal só entrega o PDF do próprio cliente (404 para os outros)', async () => {
    prisma.cronogramaCliente.findUnique.mockResolvedValue({ clienteId: 'c1', arquivoKey: 'k', nomeArquivo: 'a.pdf' });
    await expect(service.arquivo('id1', 'outro-cliente')).rejects.toThrow(NotFoundException);
    expect(storage.getFileStream).not.toHaveBeenCalled();
    storage.getFileStream.mockResolvedValue({ stream: 's', contentLength: 3 });
    await expect(service.arquivo('id1', 'c1')).resolves.toEqual({ stream: 's', contentLength: 3, nomeArquivo: 'a.pdf' });
  });

  it('esconde quem enviou na listagem do portal', async () => {
    prisma.cronogramaCliente.findMany.mockResolvedValue([{ id: '1', titulo: 'T', enviadoPor: { id: 'u1', nome: 'Ana' } }]);
    expect(await service.listar('c1', false)).toEqual([{ id: '1', titulo: 'T' }]);
    expect(await service.listar('c1')).toEqual([{ id: '1', titulo: 'T', enviadoPor: { id: 'u1', nome: 'Ana' } }]);
  });
});
