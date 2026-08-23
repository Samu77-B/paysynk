-- AlterTable
ALTER TABLE "Store" ADD COLUMN "exchangeRate" DOUBLE PRECISION;
ALTER TABLE "Store" ADD COLUMN "fxQuoteCurrency" TEXT NOT NULL DEFAULT 'gbp';
