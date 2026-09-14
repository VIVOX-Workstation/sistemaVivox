import { IsArray, IsString } from 'class-validator';

export class SetObservadoresDto {
  @IsArray()
  @IsString({ each: true })
  observadorIds: string[];
}
