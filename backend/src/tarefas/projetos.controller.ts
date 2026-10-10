import { KanbanService } from '../kanban/kanban.service';
import { syncActor } from '../kanban/kanban.controller';
import { ModuloSistema } from '@prisma/client';
import { RequerModulo } from '../auth/modulos.decorator';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { TarefasService } from './tarefas.service';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@RequerModulo({ todos: [ModuloSistema.GP] })
@Controller('projetos')
@UseGuards(JwtAuthGuard)
export class ProjetosController {
  constructor(private readonly tarefasService: TarefasService, private readonly kanban: KanbanService) {}

  @Get()
  findAll(@Query('clienteId') clienteId?: string) {
    return this.tarefasService.findAllProjetos(clienteId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const project = await this.tarefasService.findProjetoById(id);
    return { ...project, tarefas: await this.kanban.listTasks(syncActor(req), { projetoId: id }) };
  }

  @Post()
  create(@Body() dto: CreateProjetoDto) {
    return this.tarefasService.createProjeto(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjetoDto) {
    return this.tarefasService.updateProjeto(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Somente administradores podem excluir workspaces.');
    return this.tarefasService.removeProjeto(id);
  }
}
