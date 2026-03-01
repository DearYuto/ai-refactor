import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AuthService } from './auth.service';
import { TwoFactorController } from './two-factor.controller';
import { TwoFactorService } from './two-factor.service';
import { EmailVerificationController } from './email-verification.controller';
import { EmailVerificationService } from './email-verification.service';
import { DatabaseModule } from '../database/database.module';
import { LoggerModule } from '../common/logger/logger.module';
import { EmailModule } from '../common/email/email.module';
import { EncryptionModule } from '../common/encryption/encryption.module';

@Module({
  imports: [
    DatabaseModule,
    LoggerModule,
    EmailModule,
    EncryptionModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');

        // 🔒 CRITICAL SECURITY: 프로덕션에서는 JWT_SECRET 필수
        if (!secret && process.env.NODE_ENV === 'production') {
          throw new Error(
            'JWT_SECRET must be set in production environment. ' +
            'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
          );
        }

        // 개발 환경에서만 랜덤 시크릿 생성
        const finalSecret = secret || randomBytes(32).toString('hex');

        if (!secret) {
          console.warn('⚠️ JWT_SECRET not set. Using temporary random secret for development.');
        }

        return {
          secret: finalSecret,
          signOptions: { expiresIn: '1h' },
        };
      },
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
    AdminGuard,
  ],
  exports: [JwtAuthGuard, AdminGuard, JwtModule, TwoFactorService, AuthService],
})
export class AuthModule {}
