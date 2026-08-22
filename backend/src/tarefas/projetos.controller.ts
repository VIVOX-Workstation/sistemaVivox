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
} from '@nestjs/common';
import { TarefasService } from './tarefas.service';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('projetos')
@UseGuards(JwtAuthGuard)
export class ProjetosController {
  constructor(private readonly tarefasService: TarefasService) {}

  @Get()
  findAll(@Query('clienteId') clienteId?: string) {
    return this.tarefasService.findAllProjetos(clienteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tarefasService.findProjetoById(id);
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
  remove(@Param('id') id: string) {
    return this.tarefasService.removeProjeto(id);
  }
}
