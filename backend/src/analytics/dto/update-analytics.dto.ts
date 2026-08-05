import { PartialType } from '@nestjs/mapped-types';
import { CreateMetricaDto } from './create-analytics.dto';

export class UpdateAnalyticsDto extends PartialType(CreateMetricaDto) {}
