import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientesService } from './clientes.service';
import { StorageService } from '../storage/storage.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('clientes')
export class ClientesController {
  constructor(
    private readonly clientesService: ClientesService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(createClienteDto);
  }

  @Get()
  async findAll() {
    try {
      return await this.clientesService.findAll();
    } catch (e) {
      console.error('CLIENTES FINDALL ERROR STACK:', e);
      throw e;
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClienteDto: UpdateClienteDto) {
    return this.clientesService.update(id, updateClienteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientesService.remove(id);
  }

  // --- UPLOAD DE IMAGEM / LOGO & BANNER ---
  @Post(':id/upload-logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const logoUrl = await this.storageService.uploadFile(file, 'clientes/logos');
    return this.clientesService.update(id, { logoUrl });
  }

  @Post(':id/upload-banner')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBanner(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const bannerUrl = await this.storageService.uploadFile(file, 'clientes/banners');
    return this.clientesService.update(id, { bannerUrl });
  }

  // --- FONTES & CONTEXTO ---
  @Post(':id/fontes')
  addFonte(@Param('id') id: string, @Body() data: any) {
    return this.clientesService.addFonte(id, data);
  }

  @Patch('fontes/:fonteId')
  updateFonte(@Param('fonteId') fonteId: string, @Body() data: any) {
    return this.clientesService.updateFonte(fonteId, data);
  }

  @Delete('fontes/:fonteId')
  removeFonte(@Param('fonteId') fonteId: string) {
    return this.clientesService.removeFonte(fonteId);
  }
}
