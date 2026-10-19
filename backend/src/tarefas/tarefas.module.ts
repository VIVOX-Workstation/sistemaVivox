import { KanbanService } from '../kanban/kanban.service';
import { KanbanController } from '../kanban/kanban.controller';
import { KanbanEquipeService } from '../kanban/kanban-equipe.service';
import { Module } from '@nestjs/common';
import { TarefasService } from './tarefas.service';
import { TarefasController } from './tarefas.controller';
import { ProjetosController } from './projetos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TarefasController, ProjetosController, KanbanController],
  providers: [TarefasService, KanbanService, KanbanEquipeService],
  exports: [TarefasService],
})
export class TarefasModule {}
