import { BadRequestException, Injectable } from '@nestjs/common';
import { DEFAULT_BALANCES } from '../common/constants/assets';

type WalletBalance = {
  asset: string;
  available: number;
};

@Injectable()
export class WalletService {
  private readonly balancesByUser = new Map<string, WalletBalance[]>();

  getBalances(email: string): WalletBalance[] {
    return this.getOrCreateBalances(email);
  }

  adjustBalance(email: string, asset: string, delta: number): WalletBalance {
    if (!Number.isFinite(delta)) {
      throw new BadRequestException('Invalid balance adjustment');
    }

    const balances = this.getOrCreateBalances(email);
    const balance = balances.find((item) => item.asset === asset);

    if (!balance) {
      throw new BadRequestException('Unsupported asset');
    }

    const nextAvailable = balance.available + delta;
    if (nextAvailable < 0) {
      throw new BadRequestException('Insufficient balance');
    }

    balance.available = nextAvailable;
    return balance;
  }

  /**
   * Atomically swap balances between two assets for a single user.
   * If either adjustment would fail, neither is applied.
   */
  swapBalances(
    email: string,
    debit: { asset: string; amount: number },
    credit: { asset: string; amount: number },
  ): void {
    const balances = this.getOrCreateBalances(email);

    const debitBalance = balances.find((item) => item.asset === debit.asset);
    const creditBalance = balances.find((item) => item.asset === credit.asset);

    if (!debitBalance || !creditBalance) {
      throw new BadRequestException('Unsupported asset');
    }

    const nextDebit = debitBalance.available - debit.amount;
    if (nextDebit < 0) {
      throw new BadRequestException('Insufficient balance');
    }

    debitBalance.available = nextDebit;
    creditBalance.available = creditBalance.available + credit.amount;
  }

  private getOrCreateBalances(email: string): WalletBalance[] {
    const existing = this.balancesByUser.get(email);
    if (existing) {
      return existing;
    }

    const balances = DEFAULT_BALANCES.map((balance) => ({ ...balance }));
    this.balancesByUser.set(email, balances);
    return balances;
  }
}
