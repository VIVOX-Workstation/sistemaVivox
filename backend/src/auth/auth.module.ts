import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    AnalyticsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'troque-por-um-segredo-forte',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
