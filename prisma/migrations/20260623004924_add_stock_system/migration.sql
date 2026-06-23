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
ALTER TABLE "StockMovement" ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "reason" DROP NOT NULL;

-- CreateTable
CREATE TABLE "StockAlert" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minStock" INTEGER NOT NULL DEFAULT 5,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockAlert_productId_key" ON "StockAlert"("productId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- AddForeignKey
ALTER TABLE "StockAlert" ADD CONSTRAINT "StockAlert_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
