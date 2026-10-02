import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TipoServico } from '@prisma/client';

export class CreateInteresseDto {
  @IsEnum(TipoServico)
  tipoServico: TipoServico;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  mensagem?: string;
}
