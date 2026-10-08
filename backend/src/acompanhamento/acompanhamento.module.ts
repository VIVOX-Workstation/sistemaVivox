import { Module } from '@nestjs/common';
import { AcompanhamentoController } from './acompanhamento.controller';
import { AcompanhamentoService } from './acompanhamento.service';
import { CronogramasService } from './cronogramas.service';

@Module({
  controllers: [AcompanhamentoController],
  providers: [AcompanhamentoService, CronogramasService],
  exports: [AcompanhamentoService, CronogramasService],
})
export class AcompanhamentoModule {}
