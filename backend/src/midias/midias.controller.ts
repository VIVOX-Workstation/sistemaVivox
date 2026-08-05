import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { MidiasService } from './midias.service';
import { CreateMidiaDto } from './dto/create-midia.dto';
import { UpdateMidiaDto } from './dto/update-midia.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('midias')
export class MidiasController {
  constructor(
    private readonly midiasService: MidiasService,
    private readonly storageService: StorageService
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @Body() createMidiaDto: CreateMidiaDto,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    // Caso de múltiplos arquivos (batch upload)
    if (files && files.length > 0) {
      const midiasCriadas: any[] = [];
      for (const file of files) {
        const url = await this.storageService.uploadFile(file, 'midias');
        const midia = await this.midiasService.create({ ...createMidiaDto, url });
        midiasCriadas.push(midia);
      }
      return midiasCriadas;
    }
    // Caso o frontend já mande a url preenchida
    return this.midiasService.create(createMidiaDto);
  }

  @Get()
  findAll() {
    return this.midiasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.midiasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMidiaDto: UpdateMidiaDto) {
    return this.midiasService.update(id, updateMidiaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.midiasService.remove(id);
  }
}
