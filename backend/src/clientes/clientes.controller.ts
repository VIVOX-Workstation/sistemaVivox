import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

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
