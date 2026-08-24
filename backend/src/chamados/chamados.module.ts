import { Module } from '@nestjs/common';
import { ChamadosService } from './chamados.service';
import { ChamadosController } from './chamados.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TarefasModule } from '../tarefas/tarefas.module';

@Module({
  imports: [PrismaModule, TarefasModule],
  controllers: [ChamadosController],
  providers: [ChamadosService],
  exports: [ChamadosService],
})
export class ChamadosModule {}
