import { IsString, IsEnum, IsOptional } from 'class-validator';
import { TipoProducao, StatusProducao } from '@prisma/client';

export class CreateProducoeDto {
  @IsString()
  clienteId: string;

  @IsString()
  @IsOptional()
  servicoId?: string;

  @IsEnum(TipoProducao)
  tipo: TipoProducao;

  @IsString()
  @IsOptional()
  responsavelId?: string;

  @IsEnum(StatusProducao)
  status: StatusProducao;

  @IsString()
  @IsOptional()
  arquivoUrl?: string;
}
