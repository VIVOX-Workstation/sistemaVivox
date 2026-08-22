import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { RagService } from './rag.service';
import { PesquisaService } from './pesquisa.service';
import { IaController } from './ia.controller';
import { ClientSpecialistAgent } from './agents/client-specialist.agent';
import { VivoxMasterAgent } from './agents/vivox-master.agent';

@Module({
  imports: [PrismaModule, AnalyticsModule],
  controllers: [IaController],
  providers: [RagService, PesquisaService, ClientSpecialistAgent, VivoxMasterAgent],
  exports: [RagService, PesquisaService, ClientSpecialistAgent, VivoxMasterAgent],
})
export class IaModule {}


