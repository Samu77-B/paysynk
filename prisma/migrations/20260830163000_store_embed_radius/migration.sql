-- AlterTable
ALTER TABLE "Store" ADD COLUMN "embedRadius" TEXT NOT NULL DEFAULT 'paysynk';

-- JoJo & Flo's site uses square CONTACT US buttons; inherit copies that.
UPDATE "Store" SET "embedRadius" = 'inherit' WHERE slug = 'jojo-flo-london';
