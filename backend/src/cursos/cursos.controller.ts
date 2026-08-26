import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { CursosService } from './cursos.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';
import { ReordenarDto } from './dto/reordenar.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';

@Controller('cursos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CursosController {
  constructor(
    private readonly cursosService: CursosService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  create(@Body() createCursoDto: CreateCursoDto, @Req() req: any) {
    const autorId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.cursosService.create(createCursoDto, autorId);
  }

  @Get()
  findAll() {
    return this.cursosService.findAll();
  }

  @Patch('reordenar')
  reordenarCursos(@Body() reordenarDto: ReordenarDto) {
    return this.cursosService.reordenarCursos(reordenarDto.ids);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cursosService.findOne(id);
  }

  @Post(':id/capa')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCapaCurso(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const capaUrl = await this.storageService.uploadFile(file, 'cursos');
    return this.cursosService.update(id, { capaUrl });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCursoDto: UpdateCursoDto) {
    return this.cursosService.update(id, updateCursoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cursosService.remove(id);
  }

  // --- Módulos ---

  @Post(':id/modulos')
  createModulo(@Param('id') id: string, @Body() createModuloDto: CreateModuloDto) {
    return this.cursosService.addModulo(id, createModuloDto);
  }

  @Patch('/modulos/:moduloId')
  updateModulo(@Param('moduloId') moduloId: string, @Body() updateModuloDto: UpdateModuloDto) {
    return this.cursosService.updateModulo(moduloId, updateModuloDto);
  }

  @Delete('/modulos/:moduloId')
  removeModulo(@Param('moduloId') moduloId: string) {
    return this.cursosService.removeModulo(moduloId);
  }

  @Patch('/modulos/curso/:cursoId/reordenar')
  reordenarModulos(@Param('cursoId') cursoId: string, @Body() reordenarDto: ReordenarDto) {
    return this.cursosService.reordenarModulos(cursoId, reordenarDto.ids);
  }

  // --- Aulas ---

  @Post('/modulos/:moduloId/aulas')
  createAula(@Param('moduloId') moduloId: string, @Body() createAulaDto: CreateAulaDto) {
    return this.cursosService.addAula(moduloId, createAulaDto);
  }

  @Patch('/aulas/:aulaId')
  updateAula(@Param('aulaId') aulaId: string, @Body() updateAulaDto: UpdateAulaDto) {
    return this.cursosService.updateAula(aulaId, updateAulaDto);
  }

  @Delete('/aulas/:aulaId')
  removeAula(@Param('aulaId') aulaId: string) {
    return this.cursosService.removeAula(aulaId);
  }

  @Patch('/aulas/modulo/:moduloId/reordenar')
  reordenarAulas(@Param('moduloId') moduloId: string, @Body() reordenarDto: ReordenarDto) {
    return this.cursosService.reordenarAulas(moduloId, reordenarDto.ids);
  }

  @Post('aulas/:aulaId/capa')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCapaAula(@Param('aulaId') aulaId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const capaUrl = await this.storageService.uploadFile(file, 'aulas');
    return this.cursosService.updateAula(aulaId, { capaUrl });
  }
}
