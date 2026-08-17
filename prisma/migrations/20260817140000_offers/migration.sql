-- CreateEnum
CREATE TYPE "OfferKind" AS ENUM ('code', 'bundle', 'gift');

-- CreateEnum
CREATE TYPE "DiscountKind" AS ENUM ('percent', 'amount');

-- CreateEnum
CREATE TYPE "GiftMode" AS ENUM ('per_item', 'per_order');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "discountMinor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "discountCode" TEXT;

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "kind" "OfferKind" NOT NULL,
    "title" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "code" TEXT,
    "discountKind" "DiscountKind",
    "discountValue" INTEGER,
    "minSubtotalMinor" INTEGER,
    "productIdA" TEXT,
    "productIdB" TEXT,
    "bundleOffMinor" INTEGER,
    "giftProductId" TEXT,
    "giftMode" "GiftMode",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Offer_storeId_active_idx" ON "Offer"("storeId", "active");

-- CreateIndex
CREATE INDEX "Offer_storeId_kind_idx" ON "Offer"("storeId", "kind");

-- One live code string per store (NULLs allowed for bundle/gift rows)
CREATE UNIQUE INDEX "Offer_storeId_code_key" ON "Offer"("storeId", "code") WHERE "code" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
