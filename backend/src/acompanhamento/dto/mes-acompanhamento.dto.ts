import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class MesAcompanhamentoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  ano: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;
}
