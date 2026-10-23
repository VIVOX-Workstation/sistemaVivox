import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ModuloSistema, Role } from '@prisma/client';
import { createHash } from 'node:crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { SalvarPropostaDto, SalvarPropostaPdfDto } from './proposta.dto';
import { PropostasController } from './propostas.controller';
import { PropostasService } from './propostas.service';
import { criptografarLink, decifrarLink } from './proposta-link.crypto';

// O StorageService importa o uuid em ESM, que o Jest não transforma; aqui ele é sempre mock.
jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

describe('Propostas: documento, validação e compartilhamento', () => {
  const prisma = {
    cliente: { findUnique: jest.fn() },
    proposta: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const storage = { uploadRawFile: jest.fn(), deleteFile: jest.fn(), getFileStream: jest.fn() };
  const service = new PropostasService(prisma as unknown as PrismaService, storage as unknown as StorageService);
  const documento: SalvarPropostaDto = {
    titulo: 'Plataforma',
    destinatario: 'Cliente',
    apresentacao: 'Cursos em vídeo',
    corDestaque: '#91672b',
    validade: '2026-11-02',
    secoes: [{ titulo: 'Investimento', texto: '**R$ 10.000,00**' }],
  };
  beforeEach(() => {
    jest.resetAllMocks();
    prisma.cliente.findUnique.mockResolvedValue({ id: 'c1' });
    prisma.proposta.findFirst.mockResolvedValue({ id: 'p1' });
  });
  const segredoOriginal = process.env.JWT_SECRET;
  beforeAll(() => { process.env.JWT_SECRET = 'segredo-exclusivo-dos-testes'; });
  afterAll(() => {
    if (segredoOriginal === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = segredoOriginal;
  });

  it('cria o documento e persiste todos os campos editáveis', async () => {
    await service.criar('c1', documento);
    expect(prisma.proposta.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          ...documento,
          clienteId: 'c1',
          demo: null,
          validade: new Date('2026-11-02T00:00:00Z'),
        },
      }),
    );
  });
  it.each(['ensino', null, undefined])('persiste demo %s ao criar e editar', async (demo) => {
    const dto = { ...documento, demo };
    await service.criar('c1', dto);
    await service.editar('c1', 'p1', dto);
    const esperado = expect.objectContaining({
      data: expect.objectContaining({ demo: demo ?? null }),
      select: expect.objectContaining({ demo: true }),
    });
    expect(prisma.proposta.create).toHaveBeenCalledWith(esperado);
    expect(prisma.proposta.update).toHaveBeenCalledWith(esperado);
  });
  it.each(['ensino', null, undefined])('DTO aceita demo %s', async (demo) => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    const dto = await pipe.transform(
      { ...documento, ...(demo !== undefined ? { demo } : {}) },
      { type: 'body', metatype: SalvarPropostaDto },
    );
    expect(dto.demo).toBe(demo);
  });
  it('não altera uma proposta de outro cliente', async () => {
    prisma.proposta.findFirst.mockResolvedValue(null);
    await expect(
      service.editar('outro-cliente', 'p1', documento),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.proposta.update).not.toHaveBeenCalled();
  });
  it('preserva o HTML editável e os estilos estruturais do modelo ao salvar', async () => {
    const html =
      '<div class="features"><article class="feature"><h3>Escopo</h3><p>Valor editado</p></article></div>';
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    const dto = await pipe.transform(
      { ...documento, secoes: [{ titulo: 'Escopo', texto: '', html }] },
      { type: 'body', metatype: SalvarPropostaDto },
    );
    await service.criar('c1', dto);
    expect(prisma.proposta.create.mock.calls[0][0].data.secoes[0].html).toBe(
      html,
    );
  });
  it('gera segredo aleatório, persiste hash e token criptografado; novo link tem outro segredo', async () => {
    const a = await service.compartilhar('c1', 'p1');
    const b = await service.compartilhar('c1', 'p1');
    expect(a.token).toMatch(/^[a-f0-9]{64}$/);
    expect(b.token).not.toBe(a.token);
    expect(prisma.proposta.update.mock.calls[0][0].data.linkHash).toBe(
      createHash('sha256').update(a.token).digest('hex'),
    );
    const guardado = prisma.proposta.update.mock.calls[0][0].data.linkTokenCriptografado;
    expect(guardado).not.toContain(a.token);
    expect(decifrarLink(guardado)).toBe(a.token);
  });
  it('consulta repetidamente o mesmo link ativo sem gravar ou substituir o token', async () => {
    const token = 'a'.repeat(64);
    prisma.proposta.findFirst.mockResolvedValue({
      linkHash: createHash('sha256').update(token).digest('hex'),
      linkTokenCriptografado: criptografarLink(token),
    });
    expect(await service.linkAtivo('c1', 'p1')).toEqual({ token });
    expect(await service.linkAtivo('c1', 'p1')).toEqual({ token });
    expect(prisma.proposta.findFirst).toHaveBeenCalledWith({
      where: { id: 'p1', clienteId: 'c1' },
      select: { linkHash: true, linkTokenCriptografado: true },
    });
    expect(prisma.proposta.update).not.toHaveBeenCalled();
  });
  it('não recupera o link de outro cliente', async () => {
    prisma.proposta.findFirst.mockResolvedValue(null);
    await expect(service.linkAtivo('outro', 'p1')).rejects.toThrow(NotFoundException);
  });
  it.each([
    { linkHash: null, linkTokenCriptografado: null },
    { linkHash: 'antigo', linkTokenCriptografado: null },
    { linkHash: null, linkTokenCriptografado: 'token-revogado' },
  ])('não recria automaticamente link legado ou revogado: %j', async (registro) => {
    prisma.proposta.findFirst.mockResolvedValue(registro);
    expect(await service.linkAtivo('c1', 'p1')).toEqual({ token: null });
    expect(prisma.proposta.update).not.toHaveBeenCalled();
  });
  it('rejeita token criptografado que não corresponde ao hash ativo', async () => {
    prisma.proposta.findFirst.mockResolvedValue({ linkHash: 'outro', linkTokenCriptografado: criptografarLink('a'.repeat(64)) });
    await expect(service.linkAtivo('c1', 'p1')).rejects.toThrow(NotFoundException);
  });
  it('usa IVs diferentes e rejeita tokens adulterados ou uma chave diferente', () => {
    const token = 'c'.repeat(64);
    const cifrado = criptografarLink(token);
    expect(criptografarLink(token)).not.toBe(cifrado);
    const adulterado = (cifrado[0] === '0' ? '1' : '0') + cifrado.slice(1);
    expect(() => decifrarLink(adulterado)).toThrow();
    const segredo = process.env.JWT_SECRET;
    try {
      process.env.JWT_SECRET = 'chave-rotacionada';
      expect(() => decifrarLink(cifrado)).toThrow();
      delete process.env.JWT_SECRET;
      expect(() => criptografarLink(token)).toThrow(/JWT_SECRET/);
    } finally { process.env.JWT_SECRET = segredo; }
  });
  it.each(['ensino', null])('busca documento público com demo %s sem relação ou segredo do cliente', async (demo) => {
    prisma.proposta.findUnique.mockResolvedValue({ ...documento, demo });
    const proposta = await service.publica('a'.repeat(64));
    expect(proposta).toEqual({ ...documento, demo });
    expect(proposta).not.toHaveProperty('linkHash');
    expect(proposta).not.toHaveProperty('linkTokenCriptografado');
    const consulta = prisma.proposta.findUnique.mock.calls[0][0];
    expect(consulta.where.linkHash).toBe(
      createHash('sha256').update('a'.repeat(64)).digest('hex'),
    );
    expect(consulta.select).not.toHaveProperty('cliente');
    expect(consulta.select).not.toHaveProperty('linkHash');
    expect(consulta.select).not.toHaveProperty('linkTokenCriptografado');
    expect(consulta.select).not.toHaveProperty('clienteId');
    expect(consulta.select.createdAt).toBe(true);
    expect(consulta.select.demo).toBe(true);
  });
  it('revoga link e rejeita links inexistentes ou inválidos', async () => {
    await service.revogar('c1', 'p1');
    expect(prisma.proposta.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { linkHash: null, linkTokenCriptografado: null } }),
    );
    prisma.proposta.findUnique.mockResolvedValue(null);
    await expect(service.publica('b'.repeat(64))).rejects.toThrow(
      NotFoundException,
    );
    prisma.proposta.findUnique.mockClear();
    await expect(service.publica('p1')).rejects.toThrow(NotFoundException);
    expect(prisma.proposta.findUnique).not.toHaveBeenCalled();
  });
  it('whitelist preserva seções e remove campos internos inclusive dentro de seções', async () => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    const dto = await pipe.transform(
      {
        ...documento,
        linkHash: 'injetado',
        linkTokenCriptografado: 'injetado',
        secoes: [{ titulo: 'Escopo', texto: '', token: 'injetado' }],
      },
      { type: 'body', metatype: SalvarPropostaDto },
    );
    expect(dto).not.toHaveProperty('linkHash');
    expect(dto).not.toHaveProperty('linkTokenCriptografado');
    expect(dto.secoes[0]).not.toHaveProperty('token');
    expect(dto.secoes[0]).toEqual({ titulo: 'Escopo', texto: '' });
  });
  it.each([
    { demo: 'outra' },
    { validade: '2026-02-30' },
    { validade: '2026-11-02T00:00:00Z' },
    { corDestaque: 'url(javascript:alert(1))' },
    { titulo: '   ' },
    { secoes: [{ titulo: 'Escopo' }] },
    { secoes: [{ titulo: 'Escopo', texto: 123 }] },
    { secoes: Array.from({ length: 51 }, () => ({ titulo: 'x', texto: '' })) },
  ])('rejeita documento inválido: %j', async (alteracao) => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    await expect(
      pipe.transform(
        { ...documento, ...alteracao },
        { type: 'body', metatype: SalvarPropostaDto },
      ),
    ).rejects.toThrow();
  });
});

describe('Permissões das propostas pelo guard real', () => {
  const prisma = { user: { findUnique: jest.fn() } };
  const guard = new JwtAuthGuard(
    new Reflector(),
    prisma as unknown as PrismaService,
  );
  afterEach(() => jest.restoreAllMocks());
  it.each([
    [Role.ADMIN, [], true],
    [Role.COLABORADOR, [ModuloSistema.CLIENTES], true],
    [Role.COLABORADOR, [ModuloSistema.GP], false],
    [Role.COLABORADOR, [], false],
    [Role.CLIENTE, [ModuloSistema.CLIENTES], false],
  ])('papel %s e módulos %j → acesso %s', async (role, modulos, permitido) => {
    jest
      .spyOn(AuthGuard('jwt').prototype, 'canActivate')
      .mockResolvedValue(true);
    prisma.user.findUnique.mockResolvedValue({ role, modulos });
    const context = {
      getClass: () => PropostasController,
      getHandler: () => PropostasController.prototype.criar,
      switchToHttp: () => ({
        getRequest: () => ({ method: 'POST', user: { userId: 'u1', role } }),
      }),
    } as unknown as ExecutionContext;
    if (permitido) expect(await guard.canActivate(context)).toBe(true);
    else
      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
  });
});

describe('Propostas em PDF', () => {
  const prisma = {
    cliente: { findUnique: jest.fn() },
    proposta: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  };
  const storage = { uploadRawFile: jest.fn(), deleteFile: jest.fn(), getFileStream: jest.fn() };
  const service = new PropostasService(prisma as unknown as PrismaService, storage as unknown as StorageService);
  const pdf = (conteudo = '%PDF-1.7 corpo') =>
    ({ buffer: Buffer.from(conteudo), size: conteudo.length, originalname: Buffer.from('Proposta Clínica.pdf', 'utf8').toString('latin1') }) as Express.Multer.File;
  const dto: SalvarPropostaPdfDto = { titulo: 'Site institucional', destinatario: 'Dra. Ana', validade: '2026-12-01' };

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.cliente.findUnique.mockResolvedValue({ id: 'c1' });
    storage.deleteFile.mockResolvedValue(undefined);
  });

  it('guarda o PDF no storage e registra arquivo, tamanho e quem criou', async () => {
    await service.criarPdf('c1', pdf(), dto, 'u1');
    const key = storage.uploadRawFile.mock.calls[0][0];
    expect(key).toMatch(/^propostas\/c1\/[0-9a-f-]{36}\.pdf$/);
    const { data, select } = prisma.proposta.create.mock.calls[0][0];
    expect(data).toEqual(expect.objectContaining({
      clienteId: 'c1', formato: 'pdf', arquivoKey: key, nomeArquivo: 'Proposta Clínica.pdf',
      tamanho: 14, criadoPorId: 'u1', secoes: [], apresentacao: '', validade: new Date('2026-12-01T00:00:00Z'),
    }));
    expect(select).not.toHaveProperty('arquivoKey');
  });

  it.each([
    ['sem arquivo', undefined],
    ['arquivo que não é PDF', pdf('<html>')],
  ])('rejeita %s sem gravar nada', async (_caso, arquivo) => {
    await expect(service.criarPdf('c1', arquivo, dto)).rejects.toThrow(BadRequestException);
    expect(storage.uploadRawFile).not.toHaveBeenCalled();
    expect(prisma.proposta.create).not.toHaveBeenCalled();
  });

  it('apaga o arquivo enviado se o registro falhar', async () => {
    prisma.proposta.create.mockRejectedValue(new Error('banco'));
    await expect(service.criarPdf('c1', pdf(), dto)).rejects.toThrow('banco');
    expect(storage.deleteFile).toHaveBeenCalledWith(storage.uploadRawFile.mock.calls[0][0]);
  });

  it('troca o PDF e apaga o anterior; sem arquivo novo só atualiza os dados', async () => {
    prisma.proposta.findFirst.mockResolvedValue({ id: 'p1', formato: 'pdf', arquivoKey: 'propostas/c1/antigo.pdf' });
    await service.editarPdf('c1', 'p1', pdf(), dto);
    expect(storage.deleteFile).toHaveBeenCalledWith('propostas/c1/antigo.pdf');
    jest.clearAllMocks();
    await service.editarPdf('c1', 'p1', undefined, dto);
    expect(storage.uploadRawFile).not.toHaveBeenCalled();
    expect(storage.deleteFile).not.toHaveBeenCalled();
    expect(prisma.proposta.update.mock.calls[0][0].data).not.toHaveProperty('arquivoKey');
  });

  it('não mistura os formatos ao editar', async () => {
    prisma.proposta.findFirst.mockResolvedValue({ id: 'p1', formato: 'documento', arquivoKey: null });
    await expect(service.editarPdf('c1', 'p1', pdf(), dto)).rejects.toThrow(BadRequestException);
    prisma.proposta.findFirst.mockResolvedValue({ id: 'p1', formato: 'pdf', arquivoKey: 'k' });
    await expect(
      service.editar('c1', 'p1', { ...dto, apresentacao: '', corDestaque: '#91672b', secoes: [] }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.proposta.update).not.toHaveBeenCalled();
  });

  it('excluir apaga o arquivo do storage', async () => {
    prisma.proposta.findFirst.mockResolvedValue({ id: 'p1', formato: 'pdf', arquivoKey: 'propostas/c1/x.pdf' });
    await service.excluir('c1', 'p1');
    expect(storage.deleteFile).toHaveBeenCalledWith('propostas/c1/x.pdf');
  });

  it('serve o PDF só da proposta do cliente e pelo hash do link público', async () => {
    prisma.proposta.findFirst.mockResolvedValue(null);
    await expect(service.arquivo('outro', 'p1')).rejects.toThrow(NotFoundException);
    expect(prisma.proposta.findFirst.mock.calls[0][0].where).toEqual({ id: 'p1', clienteId: 'outro' });
    prisma.proposta.findUnique.mockResolvedValue({ arquivoKey: 'k', nomeArquivo: 'a.pdf' });
    storage.getFileStream.mockResolvedValue({ stream: 's', contentLength: 3 });
    expect(await service.arquivoPublico('a'.repeat(64))).toEqual({ stream: 's', contentLength: 3, nomeArquivo: 'a.pdf' });
    expect(prisma.proposta.findUnique.mock.calls[0][0].where.linkHash).toBe(createHash('sha256').update('a'.repeat(64)).digest('hex'));
  });

  it.each([{ titulo: '  ' }, { validade: '01/12/2026' }, { corDestaque: 'red' }])('DTO rejeita %j', async (alteracao) => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    await expect(pipe.transform({ ...dto, ...alteracao }, { type: 'body', metatype: SalvarPropostaPdfDto })).rejects.toThrow();
  });

  it('DTO aceita validade em branco do formulário', async () => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    const lido = await pipe.transform({ ...dto, validade: '', arquivoKey: 'injetado' }, { type: 'body', metatype: SalvarPropostaPdfDto });
    expect(lido.validade).toBeNull();
    expect(lido).not.toHaveProperty('arquivoKey');
  });
});
