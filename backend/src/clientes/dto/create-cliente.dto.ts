import { IsString, IsOptional, IsEnum, IsArray, IsDateString } from 'class-validator';
import { StatusCliente } from '@prisma/client';

export class CreateClienteDto {
  @IsString()
  nomeFantasia: string;

  @IsString()
  @IsOptional()
  razaoSocial?: string;

  @IsString()
  cnpjCpf: string;

  @IsString()
  segmento: string;

  @IsString()
  @IsOptional()
  responsavelId?: string;

  @IsArray()
  contatos: any;

  @IsEnum(StatusCliente)
  status: StatusCliente;

  @IsDateString()
  @IsOptional()
  dataInicioContrato?: string;

  @IsDateString()
  @IsOptional()
  dataFimContrato?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @IsString()
  @IsOptional()
  observacoes?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefone?: string;

  @IsString()
  @IsOptional()
  localizacao?: string;

  @IsString()
  @IsOptional()
  loginsSenhas?: string;

  @IsString()
  @IsOptional()
  ga4PropertyId?: string;

  @IsString()
  @IsOptional()
  gscSiteUrl?: string;

  @IsString()
  @IsOptional()
  openpanelProjectId?: string;
}
