/*
  Warnings:

  - Added the required column `type` to the `StockMovement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "totalAmount" SET DEFAULT 0,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL,
ALTER COLUMN "reason" DROP NOT NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS "StockAlert" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minStock" INTEGER NOT NULL DEFAULT 5,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "StockAlert_productId_key" ON "StockAlert"("productId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'StockAlert_productId_fkey'
  ) THEN
    ALTER TABLE "StockAlert" ADD CONSTRAINT "StockAlert_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
