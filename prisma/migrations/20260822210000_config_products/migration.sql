-- AlterTable
ALTER TABLE "Store" ADD COLUMN "homeCountry" TEXT NOT NULL DEFAULT 'GB';

-- CreateEnum
CREATE TYPE "ModifierKind" AS ENUM ('none', 'amount', 'percent');

-- CreateTable
CREATE TABLE "ConfigTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "sku" TEXT NOT NULL DEFAULT '',
    "basePriceMinor" INTEGER NOT NULL DEFAULT 0,
    "uploadsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "instructionsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "definition" JSONB NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ConfigTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigProduct" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sku" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "images" TEXT[],
    "category" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "basePriceMinor" INTEGER NOT NULL DEFAULT 0,
    "uploadsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "instructionsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigOption" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ConfigOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigOptionValue" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "modifierKind" "ModifierKind" NOT NULL DEFAULT 'none',
    "modifierValue" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ConfigOptionValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigVariation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "match" JSONB NOT NULL,
    "priceMinor" INTEGER NOT NULL,
    "sku" TEXT NOT NULL DEFAULT '',
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ConfigVariation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigRelated" (
    "fromProductId" TEXT NOT NULL,
    "toProductId" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ConfigRelated_pkey" PRIMARY KEY ("fromProductId","toProductId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfigTemplate_slug_key" ON "ConfigTemplate"("slug");

-- CreateIndex
CREATE INDEX "ConfigProduct_storeId_active_idx" ON "ConfigProduct"("storeId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigProduct_storeId_slug_key" ON "ConfigProduct"("storeId", "slug");

-- CreateIndex
CREATE INDEX "ConfigOption_productId_idx" ON "ConfigOption"("productId");

-- CreateIndex
CREATE INDEX "ConfigOptionValue_optionId_idx" ON "ConfigOptionValue"("optionId");

-- CreateIndex
CREATE INDEX "ConfigVariation_productId_idx" ON "ConfigVariation"("productId");

-- AddForeignKey
ALTER TABLE "ConfigProduct" ADD CONSTRAINT "ConfigProduct_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigOption" ADD CONSTRAINT "ConfigOption_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ConfigProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigOptionValue" ADD CONSTRAINT "ConfigOptionValue_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "ConfigOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigVariation" ADD CONSTRAINT "ConfigVariation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ConfigProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigRelated" ADD CONSTRAINT "ConfigRelated_fromProductId_fkey" FOREIGN KEY ("fromProductId") REFERENCES "ConfigProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigRelated" ADD CONSTRAINT "ConfigRelated_toProductId_fkey" FOREIGN KEY ("toProductId") REFERENCES "ConfigProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
