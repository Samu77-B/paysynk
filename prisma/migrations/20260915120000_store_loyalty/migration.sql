-- CreateEnum
CREATE TYPE "LoyaltyEntryKind" AS ENUM ('product', 'service', 'redeem', 'adjust');

-- AlterTable
ALTER TABLE "Store" ADD COLUMN "loyaltyEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Store" ADD COLUMN "loyaltyProductPtsPerPound" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "Store" ADD COLUMN "loyaltyServicePtsPerPound" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Store" ADD COLUMN "loyaltyRedeemPtsPerPound" INTEGER;
ALTER TABLE "Store" ADD COLUMN "loyaltyApiKeyHash" TEXT;
ALTER TABLE "Store" ADD COLUMN "loyaltyApiKeyLast4" TEXT;

-- CreateTable
CREATE TABLE "LoyaltyMember" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyEntry" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "kind" "LoyaltyEntryKind" NOT NULL,
    "points" INTEGER NOT NULL,
    "amountMinor" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyMember_storeId_email_key" ON "LoyaltyMember"("storeId", "email");

-- CreateIndex
CREATE INDEX "LoyaltyMember_storeId_idx" ON "LoyaltyMember"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyEntry_storeId_source_sourceId_key" ON "LoyaltyEntry"("storeId", "source", "sourceId");

-- CreateIndex
CREATE INDEX "LoyaltyEntry_memberId_idx" ON "LoyaltyEntry"("memberId");

-- CreateIndex
CREATE INDEX "LoyaltyEntry_storeId_idx" ON "LoyaltyEntry"("storeId");

-- AddForeignKey
ALTER TABLE "LoyaltyMember" ADD CONSTRAINT "LoyaltyMember_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyEntry" ADD CONSTRAINT "LoyaltyEntry_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyEntry" ADD CONSTRAINT "LoyaltyEntry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LoyaltyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- JoJo & Flo: £1 products = 2 pts, £1 services = 1 pt.
UPDATE "Store"
SET
  "loyaltyEnabled" = true,
  "loyaltyProductPtsPerPound" = 2,
  "loyaltyServicePtsPerPound" = 1,
  "loyaltyRedeemPtsPerPound" = 10
WHERE slug = 'jojo-flo-london';
