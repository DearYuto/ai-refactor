import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { LoggerService } from '../common/logger/logger.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { TwoFactorService } from '../auth/two-factor.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

// 최소 출금액
const MIN_WITHDRAWAL = {
  BTC: 0.001,
  USDT: 10,
  KRW: 10000,
};

@Injectable()
export class WithdrawalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly logger: LoggerService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  /**
   * DB에서 자산별 일일 출금 한도를 가져옵니다.
   * @param asset 자산 코드 (BTC, USDT, KRW)
   * @returns 일일 출금 한도 (없으면 0 반환)
   */
  private async getDailyLimit(asset: string): Promise<number> {
    const limit = await this.prisma.withdrawalLimit.findUnique({
      where: { asset },
    });
    return limit ? Number(limit.dailyLimit) : 0;
  }

  /**
   * DB에서 자산별 출금 수수료를 동적으로 계산합니다.
   * @param asset 자산 코드 (BTC, USDT, KRW)
   * @returns 최종 출금 수수료 (baseFee + networkFee, min/max 범위 내)
   */
  private async calculateWithdrawalFee(asset: string): Promise<number> {
    const feeConfig = await this.prisma.withdrawalFee.findUnique({
      where: { asset },
    });

    if (!feeConfig) {
      this.logger.warn(
        `출금 수수료 미설정: asset=${asset}`,
        'WithdrawalsService',
      );
      throw new BadRequestException(
        `${asset} 자산의 출금 수수료가 설정되지 않았습니다. 관리자에게 문의하세요.`,
      );
    }

    const baseFee = Number(feeConfig.baseFee);
    const networkFee = feeConfig.networkFee ? Number(feeConfig.networkFee) : 0;
    const minFee = Number(feeConfig.minFee);
    const maxFee = Number(feeConfig.maxFee);

    // 최종 수수료 = baseFee + networkFee (동적 네트워크 수수료 반영 가능)
    let totalFee = baseFee + networkFee;

    // 최소/최대 범위 내로 제한
    totalFee = Math.max(minFee, Math.min(maxFee, totalFee));

    this.logger.debug(
      `출금 수수료 계산: asset=${asset}, baseFee=${baseFee}, networkFee=${networkFee}, totalFee=${totalFee}`,
      'WithdrawalsService',
    );

    return totalFee;
  }

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

    // 🔒 CRITICAL SECURITY: 2FA 검증 (출금 시 필수)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // 2FA 미활성화 시 출금 차단
    if (!user.twoFactorEnabled) {
      throw new BadRequestException(
        '출금하려면 2FA(이중 인증)를 먼저 활성화해야 합니다.',
      );
    }

    // 2FA 코드 검증
    const isValid = await this.twoFactorService.verifyTwoFactorToken(
      userId,
      dto.twoFactorToken,
    );

    if (!isValid) {
      this.logger.warn(
        `출금 시도 - 2FA 검증 실패: ${email}`,
        'WithdrawalsService',
      );
      throw new UnauthorizedException('2FA 코드가 올바르지 않습니다.');
    }

    this.logger.log(`출금 2FA 검증 성공: ${email}`, 'WithdrawalsService');

    // 1. 최소 출금액 검증
    if (dto.amount < MIN_WITHDRAWAL[dto.asset]) {
      throw new BadRequestException(
        `최소 출금액: ${MIN_WITHDRAWAL[dto.asset]} ${dto.asset}`,
      );
    }

    // 2. 출금 수수료 동적 계산
    const fee = await this.calculateWithdrawalFee(dto.asset);
    const totalAmount = dto.amount + fee;

    // 3. 잔고 확인 및 차감
    await this.walletService.subtractBalance(userId, dto.asset, totalAmount);

    // 4. 24시간 슬라이딩 윈도우 한도 확인
    // UTC 기준 문제 해결: 고정된 날짜 구분 대신 24시간 단위 사용
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentWithdrawals = await this.prisma.withdrawal.aggregate({
      where: {
        userId,
        asset: dto.asset,
        status: { in: ['approved', 'processing', 'completed'] },
        requestedAt: { gte: last24Hours },
      },
      _sum: { amount: true },
    });

    // DB에서 일일 출금 한도 가져오기
    const dailyLimit = await this.getDailyLimit(dto.asset);
    if (dailyLimit === 0) {
      // 잔고 복구
      await this.walletService.addBalance(userId, dto.asset, totalAmount);
      this.logger.warn(
        `출금 한도 미설정: asset=${dto.asset}`,
        'WithdrawalsService',
      );
      throw new BadRequestException(
        `${dto.asset} 자산의 출금 한도가 설정되지 않았습니다. 관리자에게 문의하세요.`,
      );
    }

    const last24HoursTotal = (recentWithdrawals._sum.amount || 0) + dto.amount;
    if (last24HoursTotal > dailyLimit) {
      // 잔고 복구
      await this.walletService.addBalance(userId, dto.asset, totalAmount);
      this.logger.warn(
        `출금 한도 초과: userId=${userId}, asset=${dto.asset}, 24h total=${last24HoursTotal}, limit=${dailyLimit}`,
        'WithdrawalsService',
      );
      throw new BadRequestException(
        `24시간 출금 한도 초과: 현재 ${last24HoursTotal}/${dailyLimit} ${dto.asset}`,
      );
    }

    this.logger.debug(
      `24시간 출금 한도 확인: ${last24HoursTotal}/${dailyLimit} ${dto.asset}`,
      'WithdrawalsService',
    );

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
      const notification =
        await this.notificationsService.notifyWithdrawalCompleted(
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
