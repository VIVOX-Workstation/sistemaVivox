import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { TipoPublicacao } from '@prisma/client';

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

// Período por mês (ano + mes) ou personalizado (inicio + fim, datas inclusivas), com filtro opcional de tipos.
export class FiltroAcompanhamentoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  ano?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes?: number;

  @IsOptional()
  @Matches(DATA_ISO, { message: 'inicio deve estar no formato AAAA-MM-DD' })
  inicio?: string;

  @IsOptional()
  @Matches(DATA_ISO, { message: 'fim deve estar no formato AAAA-MM-DD' })
  fim?: string;

  // Aceita "REELS,VIDEO" na query string
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map((v) => v.trim()).filter(Boolean) : value))
  @IsArray()
  @IsEnum(TipoPublicacao, { each: true })
  tipos?: TipoPublicacao[];
}
