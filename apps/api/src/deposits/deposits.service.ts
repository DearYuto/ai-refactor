import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { LoggerService } from '../common/logger/logger.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateDepositDto } from './dto/create-deposit.dto';

@Injectable()
export class DepositsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly logger: LoggerService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async getDeposits(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return [];

    return this.prisma.deposit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDeposit(email: string, dto: CreateDepositDto) {
    const userId = await this.walletService.getUserId(email);

    const deposit = await this.prisma.deposit.create({
      data: {
        userId,
        asset: dto.asset,
        amount: dto.amount,
        txHash: dto.txHash,
        status: 'pending',
      },
    });

    this.logger.log(`입금 요청 생성: ${deposit.id} - ${dto.amount} ${dto.asset}`, 'DepositsService');
    return deposit;
  }

  async confirmDeposit(depositId: string) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id: depositId } });
    if (!deposit) throw new NotFoundException('Deposit not found');
    if (deposit.status !== 'pending') {
      throw new BadRequestException('Deposit already processed');
    }

    // 잔고에 입금액 추가
    await this.walletService.addBalance(deposit.userId, deposit.asset, deposit.amount);

    // 입금 상태 업데이트
    const updated = await this.prisma.deposit.update({
      where: { id: depositId },
      data: {
        status: 'confirmed',
        confirmedAt: new Date(),
        confirmations: 6, // 충분한 확인 수
      },
    });

    this.logger.log(`입금 확인 완료: ${depositId} - ${deposit.amount} ${deposit.asset}`, 'DepositsService');

    // 사용자에게 알림
    const notification = await this.notificationsService.notifyDepositConfirmed(
      deposit.userId,
      depositId,
      deposit.amount,
      deposit.asset,
    );
    this.notificationsGateway.sendToUser(deposit.userId, notification);

    return updated;
  }
}
