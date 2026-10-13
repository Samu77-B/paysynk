-- AlterTable
ALTER TABLE "Store" ADD COLUMN "fxDisplayCurrencies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Store" ADD COLUMN "fxRates" JSONB;
