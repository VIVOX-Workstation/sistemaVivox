import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsNumber, IsInt, Min, Max, Matches, IsDateString } from 'class-validator';
import { StatusHospedagem, CicloRenovacao } from '@prisma/client';

export class CreateHospedagemDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  servicoContratadoId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  itemPlanejadoId?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dataInicioHospedagem?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  prazoHospedagemMeses?: number;

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
