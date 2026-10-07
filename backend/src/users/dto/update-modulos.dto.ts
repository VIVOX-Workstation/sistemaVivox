import { ArrayUnique, IsArray, IsEnum } from 'class-validator';
import { ModuloSistema } from '@prisma/client';

export class UpdateModulosDto {
  @IsArray()
  @IsEnum(ModuloSistema, { each: true })
  @ArrayUnique()
  modulos: ModuloSistema[];
}
