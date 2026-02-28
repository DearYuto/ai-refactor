import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    // 파일 로그 설정 (매일 로테이션)
    const fileRotateTransport = new winston.transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d', // 14일간 보관
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    });

    // 에러 로그 별도 파일
    const errorFileTransport = new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d', // 에러는 30일간 보관
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    });

    // 콘솔 출력
    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          const contextStr = context ? `[${context}]` : '';
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${timestamp} ${level} ${contextStr} ${message} ${metaStr}`;
        }),
      ),
    });

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      transports: [consoleTransport, fileRotateTransport, errorFileTransport],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // 커스텀 메서드들
  logOrder(action: string, userId: string, orderId: string, details?: any) {
    this.logger.info('Order Event', {
      context: 'OrdersService',
      action,
      userId,
      orderId,
      ...details,
    });
  }

  logTrade(buyOrderId: string, sellOrderId: string, price: number, size: number) {
    this.logger.info('Trade Executed', {
      context: 'MatchingEngine',
      buyOrderId,
      sellOrderId,
      price,
      size,
    });
  }

  logAuth(action: string, email: string, success: boolean) {
    this.logger.info('Auth Event', {
      context: 'AuthService',
      action,
      email,
      success,
    });
  }
}
