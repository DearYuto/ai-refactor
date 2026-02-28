import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly logger: LoggerService) {
    // 개발 환경: Ethereal Email (테스트용)
    if (process.env.NODE_ENV !== 'production') {
      this.createTestTransporter();
    } else {
      // 프로덕션: 실제 SMTP 설정
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  private async createTestTransporter() {
    const testAccount = await nodemailer.createTestAccount();
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    this.logger.log(
      `Test email account: ${testAccount.user}`,
      'EmailService',
    );
  }

  async sendVerificationEmail(to: string, token: string) {
    const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;

    const info = await this.transporter.sendMail({
      from: '"CryptoExchange" <noreply@cryptoexchange.com>',
      to,
      subject: '이메일 인증',
      html: `
        <h1>이메일 인증</h1>
        <p>아래 링크를 클릭하여 이메일을 인증해주세요:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
        <p>이 링크는 24시간 동안 유효합니다.</p>
      `,
    });

    this.logger.log(`이메일 발송: ${to} - ${info.messageId}`, 'EmailService');

    // 테스트 환경: 미리보기 URL 로그
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(
        `Preview URL: ${nodemailer.getTestMessageUrl(info)}`,
        'EmailService',
      );
    }

    return info;
  }

  async sendWithdrawalConfirmationEmail(
    to: string,
    withdrawalId: string,
    amount: number,
    asset: string,
  ) {
    const confirmUrl = `${process.env.FRONTEND_URL}/withdrawals/confirm?id=${withdrawalId}`;

    const info = await this.transporter.sendMail({
      from: '"CryptoExchange" <noreply@cryptoexchange.com>',
      to,
      subject: '출금 확인 요청',
      html: `
        <h1>출금 확인</h1>
        <p>출금 요청이 접수되었습니다:</p>
        <ul>
          <li>금액: ${amount} ${asset}</li>
          <li>출금 ID: ${withdrawalId}</li>
        </ul>
        <p>아래 링크를 클릭하여 출금을 확인해주세요:</p>
        <a href="${confirmUrl}">${confirmUrl}</a>
        <p>이 링크는 1시간 동안 유효합니다.</p>
      `,
    });

    this.logger.log(
      `출금 확인 이메일 발송: ${to} - ${withdrawalId}`,
      'EmailService',
    );

    return info;
  }
}
