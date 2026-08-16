-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'fulfilled';

-- AlterTable
ALTER TABLE "Store" ADD COLUMN "paymentsActive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Store" ADD COLUMN "paypalMerchantId" TEXT;
ALTER TABLE "Store" ADD COLUMN "stripeConnectId" TEXT;
