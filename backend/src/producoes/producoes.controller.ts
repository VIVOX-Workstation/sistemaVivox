import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ProducoesService } from './producoes.service';
import { CreateProducoeDto } from './dto/create-producoe.dto';
import { UpdateProducoeDto } from './dto/update-producoe.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('producoes')
export class ProducoesController {
  constructor(
    private readonly producoesService: ProducoesService,
    private readonly storageService: StorageService
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() createProducoeDto: CreateProducoeDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    let arquivoUrl: string | undefined = undefined;
    if (file) {
      arquivoUrl = await this.storageService.uploadFile(file, 'producoes');
    }
    return this.producoesService.create({ ...createProducoeDto, arquivoUrl });
  }

  @Get()
  findAll() {
    return this.producoesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.producoesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProducoeDto: UpdateProducoeDto) {
    return this.producoesService.update(id, updateProducoeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.producoesService.remove(id);
  }
}
