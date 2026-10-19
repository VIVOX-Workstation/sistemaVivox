import { Module } from '@nestjs/common';
import {
  PropostaLinkGuard,
  PropostasController,
  PropostasPublicasController,
} from './propostas.controller';
import { PropostasService } from './propostas.service';

@Module({
  controllers: [PropostasController, PropostasPublicasController],
  providers: [PropostasService, PropostaLinkGuard],
})
export class PropostasModule {}
