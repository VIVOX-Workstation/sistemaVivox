import { Test, TestingModule } from '@nestjs/testing';
import { PlanejamentoServicoService } from './planejamento-servico.service';

describe('PlanejamentoServicoService', () => {
  let service: PlanejamentoServicoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanejamentoServicoService],
    }).compile();

    service = module.get<PlanejamentoServicoService>(PlanejamentoServicoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
