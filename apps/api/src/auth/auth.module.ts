import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { TwoFactorController } from './two-factor.controller';
import { TwoFactorService } from './two-factor.service';
import { EmailVerificationController } from './email-verification.controller';
import { EmailVerificationService } from './email-verification.service';
import { DatabaseModule } from '../database/database.module';
import { LoggerModule } from '../common/logger/logger.module';
import { EmailModule } from '../common/email/email.module';

@Module({
  imports: [
    DatabaseModule,
    LoggerModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'local-dev-secret-change-in-production',
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [
    AuthController,
    TwoFactorController,
    EmailVerificationController,
  ],
  providers: [
    AuthService,
    TwoFactorService,
    EmailVerificationService,
    JwtAuthGuard,
  ],
  exports: [JwtAuthGuard, JwtModule, TwoFactorService, AuthService],
})
export class AuthModule {}
