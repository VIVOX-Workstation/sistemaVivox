import { Module } from '@nestjs/common';
import { PlanejamentoServicoController } from './planejamento-servico.controller';
import { PlanejamentoServicoService } from './planejamento-servico.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PlanejamentoServicoController],
  providers: [PlanejamentoServicoService]
})
export class PlanejamentoServicoModule {}
