import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { GoogleAuthService } from './google/google-auth.service';
import { GA4Service } from './google/ga4.service';
import { GSCService } from './google/gsc.service';
import { AnalyticsCacheService } from './google/analytics-cache.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    GoogleAuthService,
    GA4Service,
    GSCService,
    AnalyticsCacheService,
  ],
  exports: [AnalyticsService, GA4Service, GSCService, GoogleAuthService],
})
export class AnalyticsModule {}
