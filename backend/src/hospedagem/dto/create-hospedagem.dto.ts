import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { StatusHospedagem, CicloRenovacao } from '@prisma/client';

export class CreateHospedagemDto {
  @IsString()
  @IsNotEmpty()
  clienteId: string;

  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  provedorVps?: string;

  @IsString()
  @IsOptional()
  ipServidor?: string;

  @IsString()
  @IsOptional()
  dataRenovacaoVps?: string;

  @IsEnum(CicloRenovacao)
  @IsOptional()
  cicloVps?: CicloRenovacao;

  @IsNumber()
  @IsOptional()
  custoVps?: number;

  @IsNumber()
  @IsOptional()
  valorCobrado?: number;

  @IsString()
  @IsOptional()
  dominio?: string;

  @IsString()
  @IsOptional()
  registradorDominio?: string;

  @IsString()
  @IsOptional()
  dataExpiracaoDominio?: string;

  @IsString()
  @IsOptional()
  dnsProvedor?: string;

  @IsEnum(StatusHospedagem)
  @IsOptional()
  status?: StatusHospedagem;

  @IsBoolean()
  @IsOptional()
  sslAtivo?: boolean;

  @IsString()
  @IsOptional()
  observacoes?: string;
}
