import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUrl, MaxLength, Min } from 'class-validator';
import { TipoPublicacao } from '@prisma/client';

export class CreatePublicacaoDto {
  @IsDateString({ strict: true })
  dataPublicacao: string;

  @IsEnum(TipoPublicacao)
  tipo: TipoPublicacao;

  @IsOptional()
  @IsString()
  assunto?: string | null;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_valid_protocol: true, require_tld: false })
  @MaxLength(500)
  link?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  curtidas?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  comentarios?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  compartilhamentos?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  salvamentos?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  reposts?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  visualizacoes?: number | null;
}
