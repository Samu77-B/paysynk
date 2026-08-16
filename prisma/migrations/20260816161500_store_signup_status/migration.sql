-- Existing stores stay live; new stores default to pending.
CREATE TYPE "SignupStatus" AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE "Store" ADD COLUMN "signupStatus" "SignupStatus" NOT NULL DEFAULT 'approved';
ALTER TABLE "Store" ADD COLUMN "adminNotes" TEXT;
ALTER TABLE "Store" ALTER COLUMN "signupStatus" SET DEFAULT 'pending';

CREATE INDEX "Store_signupStatus_idx" ON "Store"("signupStatus");
