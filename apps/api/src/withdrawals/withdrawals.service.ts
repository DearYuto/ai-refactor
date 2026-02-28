import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { LoggerService } from '../common/logger/logger.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

// 출금 수수료 (자산별)
const WITHDRAWAL_FEES = {
  BTC: 0.0005,
  USDT: 1.0,
  KRW: 1000,
};

// 최소 출금액
const MIN_WITHDRAWAL = {
  BTC: 0.001,
  USDT: 10,
  KRW: 10000,
};

// 일일 출금 한도
const DAILY_LIMIT = {
  BTC: 10,
  USDT: 100000,
  KRW: 100000000,
};

@Injectable()
export class WithdrawalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly logger: LoggerService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async getWithdrawals(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return [];

    return this.prisma.withdrawal.findMany({
      where: { userId: user.id },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async requestWithdrawal(email: string, dto: CreateWithdrawalDto) {
    const userId = await this.walletService.getUserId(email);

    // 1. 최소 출금액 검증
    if (dto.amount < MIN_WITHDRAWAL[dto.asset]) {
      throw new BadRequestException(
        `최소 출금액: ${MIN_WITHDRAWAL[dto.asset]} ${dto.asset}`,
      );
    }

    // 2. 출금 수수료 계산
    const fee = WITHDRAWAL_FEES[dto.asset];
    const totalAmount = dto.amount + fee;

    // 3. 잔고 확인 및 차감
    await this.walletService.subtractBalance(userId, dto.asset, totalAmount);

    // 4. 일일 한도 확인 (오늘 출금한 금액 합계)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayWithdrawals = await this.prisma.withdrawal.aggregate({
      where: {
        userId,
        asset: dto.asset,
        status: { in: ['approved', 'processing', 'completed'] },
        requestedAt: { gte: today },
      },
      _sum: { amount: true },
    });

    const todayTotal = (todayWithdrawals._sum.amount || 0) + dto.amount;
    if (todayTotal > DAILY_LIMIT[dto.asset]) {
      // 잔고 복구
      await this.walletService.addBalance(userId, dto.asset, totalAmount);
      throw new BadRequestException(
        `일일 출금 한도 초과: ${DAILY_LIMIT[dto.asset]} ${dto.asset}`,
      );
    }

    // 5. 출금 요청 생성
    const withdrawal = await this.prisma.withdrawal.create({
      data: {
        userId,
        asset: dto.asset,
        amount: dto.amount,
        fee,
        toAddress: dto.toAddress,
        status: 'pending',
      },
    });

    this.logger.log(
      `출금 요청: ${withdrawal.id} - ${dto.amount} ${dto.asset} (수수료: ${fee})`,
      'WithdrawalsService',
    );

    return withdrawal;
  }

  async approveWithdrawal(withdrawalId: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.status !== 'pending') {
      throw new BadRequestException('Withdrawal already processed');
    }

    const updated = await this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'approved',
        approvedAt: new Date(),
      },
    });

    this.logger.log(`출금 승인: ${withdrawalId}`, 'WithdrawalsService');

    // TODO: 실제 블록체인 전송 트리거
    // 여기서는 즉시 completed로 변경
    setTimeout(async () => {
      await this.prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          txHash: 'simulated-tx-hash-' + Date.now(),
        },
      });
      this.logger.log(`출금 완료: ${withdrawalId}`, 'WithdrawalsService');

      // 사용자에게 알림
      const notification = await this.notificationsService.notifyWithdrawalCompleted(
        withdrawal.userId,
        withdrawalId,
        withdrawal.amount,
        withdrawal.asset,
      );
      this.notificationsGateway.sendToUser(withdrawal.userId, notification);
    }, 5000); // 5초 후 완료 (시뮬레이션)

    return updated;
  }

  async rejectWithdrawal(withdrawalId: string, reason: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.status !== 'pending') {
      throw new BadRequestException('Withdrawal already processed');
    }

    // 잔고 복구
    const totalAmount = withdrawal.amount + withdrawal.fee;
    await this.walletService.addBalance(
      withdrawal.userId,
      withdrawal.asset,
      totalAmount,
    );

    const updated = await this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'rejected',
        rejectReason: reason,
      },
    });

    this.logger.log(
      `출금 거부: ${withdrawalId} - ${reason}`,
      'WithdrawalsService',
    );

    return updated;
  }
}
