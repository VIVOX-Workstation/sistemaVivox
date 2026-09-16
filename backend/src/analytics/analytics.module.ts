import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { GoogleAuthService } from './google/google-auth.service';
import { GA4Service } from './google/ga4.service';
import { GSCService } from './google/gsc.service';
import { AnalyticsCacheService } from './google/analytics-cache.service';
import { OpenPanelAuthService } from './openpanel/openpanel-auth.service';
import { OpenPanelService } from './openpanel/openpanel.service';
import { InstagramAuthService } from './instagram/instagram-auth.service';
import { InstagramService } from './instagram/instagram.service';
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
    OpenPanelAuthService,
    OpenPanelService,
    InstagramAuthService,
    InstagramService,
  ],
  exports: [
    AnalyticsService,
    GA4Service,
    GSCService,
    GoogleAuthService,
    OpenPanelService,
    OpenPanelAuthService,
    InstagramAuthService,
    InstagramService,
  ],
})
export class AnalyticsModule {}
