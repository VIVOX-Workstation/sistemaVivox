import { SetMetadata } from '@nestjs/common';
import { ModuloSistema } from '@prisma/client';

export const MODULOS_KEY = 'modulos';
export interface ModulosRequeridos {
  todos: ModuloSistema[];
  leitura?: ModuloSistema[];
}

export const RequerModulo = (modulos: ModulosRequeridos) => SetMetadata(MODULOS_KEY, modulos);
