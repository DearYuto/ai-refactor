import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@repo/database';

type WalletBalanceRecord = {
  asset: string;
  available: number;
  locked: number;
};

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 트랜잭션 로그 기록 헬퍼 메서드
   */
  private async logTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    type: string,
    asset: string,
    amount: number,
    balanceBefore: number,
    balanceAfter: number,
    relatedId?: string,
  ): Promise<void> {
    await tx.transaction.create({
      data: {
        userId,
        type,
        asset,
        amount,
        balanceBefore,
        balanceAfter,
        relatedId,
      },
    });
  }

  async getBalances(email: string): Promise<WalletBalanceRecord[]> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { balances: true },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user.balances.map((b) => ({
      asset: b.asset,
      available: b.available,
      locked: b.locked,
    }));
  }

  /**
   * Atomically swap balances between two assets for a single user.
   * Uses a Prisma transaction for atomicity.
   */
  async swapBalances(
    email: string,
    debit: { asset: string; amount: number },
    credit: { asset: string; amount: number },
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.prisma.$transaction(async (tx) => {
      const debitBalance = await tx.walletBalance.findUnique({
        where: { userId_asset: { userId: user.id, asset: debit.asset } },
      });
      const creditBalance = await tx.walletBalance.findUnique({
        where: { userId_asset: { userId: user.id, asset: credit.asset } },
      });

      if (!debitBalance || !creditBalance) {
        throw new BadRequestException('Unsupported asset');
      }

      if (debitBalance.available < debit.amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const debitBefore = debitBalance.available;
      const creditBefore = creditBalance.available;

      await tx.walletBalance.update({
        where: { userId_asset: { userId: user.id, asset: debit.asset } },
        data: { available: { decrement: debit.amount } },
      });
      await tx.walletBalance.update({
        where: { userId_asset: { userId: user.id, asset: credit.asset } },
        data: { available: { increment: credit.amount } },
      });

      // 트랜잭션 로그 기록
      await this.logTransaction(
        tx,
        user.id,
        'TRADE_SELL',
        debit.asset,
        -debit.amount,
        debitBefore,
        debitBefore - debit.amount,
      );
      await this.logTransaction(
        tx,
        user.id,
        'TRADE_BUY',
        credit.asset,
        credit.amount,
        creditBefore,
        creditBefore + credit.amount,
      );
    });
  }

  /**
   * Lock funds from available to locked (for limit orders).
   */
  async lockBalance(
    userId: string,
    asset: string,
    amount: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const balance = await tx.walletBalance.findUnique({
        where: { userId_asset: { userId, asset } },
      });
      if (!balance) {
        throw new BadRequestException('Unsupported asset');
      }
      if (balance.available < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const availableBefore = balance.available;

      await tx.walletBalance.update({
        where: { userId_asset: { userId, asset } },
        data: {
          available: { decrement: amount },
          locked: { increment: amount },
        },
      });

      // 트랜잭션 로그 기록
      await this.logTransaction(
        tx,
        userId,
        'LOCK',
        asset,
        -amount,
        availableBefore,
        availableBefore - amount,
      );
    });
  }

  /**
   * Unlock funds from locked back to available (on order cancel).
   */
  async unlockBalance(
    userId: string,
    asset: string,
    amount: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const balance = await tx.walletBalance.findUnique({
        where: { userId_asset: { userId, asset } },
      });
      if (!balance) {
        throw new BadRequestException('Unsupported asset');
      }

      const availableBefore = balance.available;

      await tx.walletBalance.update({
        where: { userId_asset: { userId, asset } },
        data: {
          locked: { decrement: amount },
          available: { increment: amount },
        },
      });

      // 트랜잭션 로그 기록
      await this.logTransaction(
        tx,
        userId,
        'UNLOCK',
        asset,
        amount,
        availableBefore,
        availableBefore + amount,
      );
    });
  }

  /**
   * Fill a limit order: deduct from locked, credit the other asset.
   */
  async fillLimitOrder(
    userId: string,
    debit: { asset: string; lockedAmount: number },
    credit: { asset: string; amount: number },
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.walletBalance.update({
        where: { userId_asset: { userId, asset: debit.asset } },
        data: { locked: { decrement: debit.lockedAmount } },
      });
      await tx.walletBalance.update({
        where: { userId_asset: { userId, asset: credit.asset } },
        data: { available: { increment: credit.amount } },
      });
    });
  }

  async getUserId(email: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user.id;
  }

  /**
   * Add balance to user's available funds (used in matching engine).
   */
  async addBalance(
    userId: string,
    asset: string,
    amount: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const balance = await tx.walletBalance.findUnique({
        where: { userId_asset: { userId, asset } },
      });
      if (!balance) {
        throw new BadRequestException('Unsupported asset');
      }

      const availableBefore = balance.available;

      await tx.walletBalance.update({
        where: { userId_asset: { userId, asset } },
        data: {
          available: { increment: amount },
        },
      });

      // 트랜잭션 로그 기록
      await this.logTransaction(
        tx,
        userId,
        'DEPOSIT',
        asset,
        amount,
        availableBefore,
        availableBefore + amount,
      );
    });
  }

  /**
   * Subtract balance from user's available funds (used for withdrawals).
   */
  async subtractBalance(
    userId: string,
    asset: string,
    amount: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const balance = await tx.walletBalance.findUnique({
        where: { userId_asset: { userId, asset } },
      });
      if (!balance) {
        throw new BadRequestException('Unsupported asset');
      }
      if (balance.available < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const availableBefore = balance.available;

      await tx.walletBalance.update({
        where: { userId_asset: { userId, asset } },
        data: {
          available: { decrement: amount },
        },
      });

      // 트랜잭션 로그 기록
      await this.logTransaction(
        tx,
        userId,
        'WITHDRAW',
        asset,
        -amount,
        availableBefore,
        availableBefore - amount,
      );
    });
  }
}
