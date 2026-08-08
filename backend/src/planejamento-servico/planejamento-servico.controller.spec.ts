import { Test, TestingModule } from '@nestjs/testing';
import { PlanejamentoServicoController } from './planejamento-servico.controller';

describe('PlanejamentoServicoController', () => {
  let controller: PlanejamentoServicoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanejamentoServicoController],
    }).compile();

    controller = module.get<PlanejamentoServicoController>(PlanejamentoServicoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
