-- CreateTable
CREATE TABLE "WithdrawalFee" (
    "id" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "baseFee" DECIMAL(20,8) NOT NULL,
    "networkFee" DECIMAL(20,8),
    "minFee" DECIMAL(20,8) NOT NULL,
    "maxFee" DECIMAL(20,8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalFee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawalFee_asset_key" ON "WithdrawalFee"("asset");

-- 초기 데이터 삽입 (기존 하드코딩된 값)
INSERT INTO "WithdrawalFee" ("id", "asset", "baseFee", "networkFee", "minFee", "maxFee", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'BTC', 0.0005, NULL, 0.0001, 0.001, NOW(), NOW()),
  (gen_random_uuid()::text, 'USDT', 1.0, NULL, 0.5, 5.0, NOW(), NOW()),
  (gen_random_uuid()::text, 'KRW', 1000, NULL, 500, 5000, NOW(), NOW());
