-- AlterTable
ALTER TABLE "Store" ADD COLUMN "embedAccent" TEXT;
ALTER TABLE "Store" ADD COLUMN "embedAccentText" TEXT;
ALTER TABLE "Store" ADD COLUMN "embedFont" TEXT NOT NULL DEFAULT 'paysynk';
