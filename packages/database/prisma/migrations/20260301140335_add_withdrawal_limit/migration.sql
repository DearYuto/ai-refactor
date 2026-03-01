-- CreateTable
CREATE TABLE "WithdrawalLimit" (
    "id" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "dailyLimit" DECIMAL(20,8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawalLimit_asset_key" ON "WithdrawalLimit"("asset");

-- 초기 데이터 삽입 (기존 하드코딩된 값)
INSERT INTO "WithdrawalLimit" ("id", "asset", "dailyLimit", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'BTC', 10, NOW(), NOW()),
  (gen_random_uuid()::text, 'USDT', 100000, NOW(), NOW()),
  (gen_random_uuid()::text, 'KRW', 100000000, NOW(), NOW());
