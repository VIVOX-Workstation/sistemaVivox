import { IsArray, IsString } from 'class-validator';

export class ReordenarDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
