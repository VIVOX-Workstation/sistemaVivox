import { Module } from '@nestjs/common';
import { TarefasService } from './tarefas.service';
import { TarefasController } from './tarefas.controller';
import { ProjetosController } from './projetos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TarefasController, ProjetosController],
  providers: [TarefasService],
  exports: [TarefasService],
})
export class TarefasModule {}
