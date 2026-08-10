import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RagService } from './rag.service';
import { PesquisaService } from './pesquisa.service';
import { IaController } from './ia.controller';

@Module({
  imports: [PrismaModule],
  controllers: [IaController],
  providers: [RagService, PesquisaService],
  exports: [RagService, PesquisaService],
})
export class IaModule {}
