import { HospedagemService } from './hospedagem.service';

describe('HospedagemService prazo e vínculo', () => {
  const cadastro = { id: 'h1', clienteId: 'c1', titulo: 'LP', url: 'https://example.com',
    dataInicioHospedagem: new Date('2026-10-01T00:00:00Z'), prazoHospedagemMeses: 12,
    servicoContratadoId: 's1', itemPlanejadoId: 'i1', cicloVps: 'ANUAL' };
  let prisma: any;
  let service: HospedagemService;
  beforeEach(() => {
    prisma = {
      ativoHospedagem: {
        create: jest.fn(async args => args.data),
        update: jest.fn(async args => args.data),
        findUnique: jest.fn(async () => cadastro),
      },
      servicoContratado: { findUnique: jest.fn(async () => ({ clienteId: 'c1', tipoServico: 'LANDING_PAGE', planejamento: { flowNodes: [{ id: 'i1' }] } })) },
    };
    service = new HospedagemService(prisma);
  });

  it('calcula vencimento e ciclo no cadastro', async () => {
    const resultado = await service.create({ clienteId: 'c1', titulo: 'LP', url: 'https://example.com',
      dataInicioHospedagem: '2026-10-01', prazoHospedagemMeses: 12 });
    expect(resultado.dataRenovacaoVps.toISOString()).toBe('2027-10-01T00:00:00.000Z');
    expect(resultado.cicloVps).toBe('ANUAL');
  });

  it('recalcula ao alterar só o prazo e mantém início', async () => {
    const resultado = await service.update('h1', { prazoHospedagemMeses: 24 });
    expect(resultado.dataRenovacaoVps.toISOString()).toBe('2028-10-01T00:00:00.000Z');
    expect(resultado.cicloVps).toBe('BIENAL');
  });

  it('não aceita prazo sem início', async () => {
    await expect(service.create({ clienteId: 'c1', titulo: 'LP', url: 'https://example.com', prazoHospedagemMeses: 12 })).rejects.toThrow();
    expect(prisma.ativoHospedagem.create).not.toHaveBeenCalled();
  });

  it('rejeita vínculo com serviço de outro cliente', async () => {
    prisma.servicoContratado.findUnique.mockResolvedValue({ clienteId: 'c2', tipoServico: 'LANDING_PAGE' });
    await expect(service.create({ clienteId: 'c1', titulo: 'LP', url: 'https://example.com', servicoContratadoId: 's1', itemPlanejadoId: 'i1' })).rejects.toThrow();
  });

  it('mantém cadastro legado sem exigir prazo automático', async () => {
    const resultado = await service.create({ clienteId: 'c1', titulo: 'LP', url: 'https://example.com', dataRenovacaoVps: '2027-01-01' });
    expect(resultado.dataRenovacaoVps.toISOString().slice(0, 10)).toBe('2027-01-01');
    expect(resultado.dataInicioHospedagem).toBeUndefined();
  });

  it('rejeita item que não pertence ao planejamento do serviço', async () => {
    await expect(service.create({ clienteId: 'c1', titulo: 'LP', url: 'https://example.com', servicoContratadoId: 's1', itemPlanejadoId: 'outro' })).rejects.toThrow('Salve o item');
    expect(prisma.ativoHospedagem.create).not.toHaveBeenCalled();
  });
});
