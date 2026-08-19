CREATE TYPE "SalesReportFrequency" AS ENUM ('none', 'daily', 'weekly', 'monthly');

ALTER TABLE "Store" ADD COLUMN "vatNumber" TEXT;
ALTER TABLE "Store" ADD COLUMN "notifyEmail" TEXT;
ALTER TABLE "Store" ADD COLUMN "salesReportFrequency" "SalesReportFrequency" NOT NULL DEFAULT 'none';

ALTER TABLE "Order" ADD COLUMN "customerName" TEXT;
