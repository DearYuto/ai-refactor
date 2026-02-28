import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { EmailService } from '../common/email/email.service';
import type { Notification } from '@repo/database';

export type NotificationType =
  | 'ORDER_FILLED'
  | 'DEPOSIT_CONFIRMED'
  | 'WITHDRAWAL_COMPLETED'
  | 'WITHDRAWAL_APPROVED'
  | 'WITHDRAWAL_REJECTED';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly emailService: EmailService,
  ) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
  ): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || {},
      },
    });

    this.logger.log(
      `알림 생성: ${userId} - ${type} - ${title}`,
      'NotificationsService',
    );

    return notification;
  }

  async getNotifications(userId: string, limit = 50): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });
  }

  // 주문 체결 알림
  async notifyOrderFilled(
    userId: string,
    orderId: string,
    side: string,
    size: number,
    price: number,
    asset: string,
  ): Promise<Notification> {
    const title = '주문 체결 완료';
    const message = `${side === 'buy' ? '매수' : '매도'} 주문이 체결되었습니다: ${size} ${asset} @ $${price}`;

    const notification = await this.createNotification(
      userId,
      'ORDER_FILLED',
      title,
      message,
      { orderId, side, size, price, asset },
    );

    // 이메일 알림 (선택적)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user && user.emailVerified) {
      await this.emailService.sendOrderFilledEmail(
        user.email,
        side,
        size,
        price,
        asset,
      );
    }

    return notification;
  }

  // 입금 확인 알림
  async notifyDepositConfirmed(
    userId: string,
    depositId: string,
    amount: number,
    asset: string,
  ): Promise<Notification> {
    const title = '입금 확인';
    const message = `${amount} ${asset} 입금이 확인되었습니다.`;

    const notification = await this.createNotification(
      userId,
      'DEPOSIT_CONFIRMED',
      title,
      message,
      { depositId, amount, asset },
    );

    // 이메일 알림
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user && user.emailVerified) {
      await this.emailService.sendDepositConfirmedEmail(
        user.email,
        amount,
        asset,
      );
    }

    return notification;
  }

  // 출금 완료 알림
  async notifyWithdrawalCompleted(
    userId: string,
    withdrawalId: string,
    amount: number,
    asset: string,
  ): Promise<Notification> {
    const title = '출금 완료';
    const message = `${amount} ${asset} 출금이 완료되었습니다.`;

    const notification = await this.createNotification(
      userId,
      'WITHDRAWAL_COMPLETED',
      title,
      message,
      { withdrawalId, amount, asset },
    );

    // 이메일 알림
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user && user.emailVerified) {
      await this.emailService.sendWithdrawalCompletedEmail(
        user.email,
        amount,
        asset,
      );
    }

    return notification;
  }
}
