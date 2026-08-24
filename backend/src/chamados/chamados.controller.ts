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
} from '@nestjs/common';
import { ChamadosService } from './chamados.service';
import { CreateChamadoDto } from './dto/create-chamado.dto';
import { UpdateChamadoDto } from './dto/update-chamado.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StatusChamado } from '@prisma/client';

@Controller('chamados')
@UseGuards(JwtAuthGuard)
export class ChamadosController {
  constructor(private readonly chamadosService: ChamadosService) {}

  @Get()
  findAll(
    @Query('clienteId') clienteId?: string,
    @Query('servicoId') servicoId?: string,
    @Query('status') status?: StatusChamado,
  ) {
    return this.chamadosService.findAll({ clienteId, servicoId, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chamadosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateChamadoDto, @Req() req: any) {
    const autorId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.chamadosService.create(dto, autorId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateChamadoDto, @Req() req: any) {
    const autorId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.chamadosService.update(id, dto, autorId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chamadosService.remove(id);
  }

  // --- Comentários ---

  @Get(':id/comentarios')
  getComentarios(@Param('id') id: string) {
    return this.chamadosService.getComentarios(id);
  }

  @Post(':id/comentarios')
  addComentario(
    @Param('id') id: string,
    @Body('texto') texto: string,
    @Req() req: any,
  ) {
    const autorId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.chamadosService.addComentario(id, texto, autorId);
  }
}
