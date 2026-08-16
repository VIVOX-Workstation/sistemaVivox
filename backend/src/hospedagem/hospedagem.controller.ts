import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { HospedagemService } from './hospedagem.service';
import { CreateHospedagemDto } from './dto/create-hospedagem.dto';
import { UpdateHospedagemDto } from './dto/update-hospedagem.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('hospedagens')
@UseGuards(JwtAuthGuard)
export class HospedagemController {
  constructor(private readonly hospedagemService: HospedagemService) {}

  @Post()
  create(@Body() createHospedagemDto: CreateHospedagemDto) {
    return this.hospedagemService.create(createHospedagemDto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.hospedagemService.findAll({ search, status });
  }

  @Get('radar')
  getRadarRenovacoes() {
    return this.hospedagemService.getRadarRenovacoes();
  }

  @Get('cliente/:clienteId')
  findByCliente(@Param('clienteId') clienteId: string) {
    return this.hospedagemService.findByCliente(clienteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hospedagemService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHospedagemDto: UpdateHospedagemDto) {
    return this.hospedagemService.update(id, updateHospedagemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hospedagemService.remove(id);
  }
}
