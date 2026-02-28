import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_BALANCES = [
  { asset: 'KRW', available: 1_000_000 },
  { asset: 'BTC', available: 0.5 },
  { asset: 'USDT', available: 2_000 },
];

export async function seedDefaultBalances(userId: string): Promise<void> {
  for (const balance of DEFAULT_BALANCES) {
    await prisma.walletBalance.upsert({
      where: { userId_asset: { userId, asset: balance.asset } },
      create: { userId, asset: balance.asset, available: balance.available },
      update: {},
    });
  }
}

async function main() {
  console.log('Seed complete. Use seedDefaultBalances(userId) on signup.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
