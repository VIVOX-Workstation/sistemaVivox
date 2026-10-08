import { Module } from '@nestjs/common';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { AcompanhamentoModule } from '../acompanhamento/acompanhamento.module';

@Module({ imports: [AcompanhamentoModule], controllers: [PortalController], providers: [PortalService], exports: [PortalService] })
export class PortalModule {}
