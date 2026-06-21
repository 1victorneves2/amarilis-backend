-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SEPARATED', 'COMPLETED', 'CANCELED');

-- AlterTable Product: add image + updatedAt
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- AlterTable Order: make userId optional, add clientName/whatsapp/total/updatedAt
ALTER TABLE "Order" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "clientName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "total" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- AlterTable Order: convert status String → OrderStatus enum
-- Step 1: add temp enum column
ALTER TABLE "Order" ADD COLUMN "status_enum" "OrderStatus" NOT NULL DEFAULT 'PENDING';
-- Step 2: populate from existing string values
UPDATE "Order" SET "status_enum" = CASE
  WHEN status = 'pending'   THEN 'PENDING'::"OrderStatus"
  WHEN status = 'confirmed' THEN 'CONFIRMED'::"OrderStatus"
  WHEN status = 'shipped'   THEN 'SEPARATED'::"OrderStatus"
  WHEN status = 'delivered' THEN 'COMPLETED'::"OrderStatus"
  WHEN status = 'cancelled' THEN 'CANCELED'::"OrderStatus"
  ELSE 'PENDING'::"OrderStatus"
END;
-- Step 3: drop old text column and rename
ALTER TABLE "Order" DROP COLUMN "status";
ALTER TABLE "Order" RENAME COLUMN "status_enum" TO "status";

-- AlterTable OrderItem: add price + createdAt
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "OrderItem" ALTER COLUMN "unitPrice" SET DEFAULT 0;

-- Update price = unitPrice for existing rows
UPDATE "OrderItem" SET price = "unitPrice" WHERE price = 0;

-- CreateTable StockMovement
CREATE TABLE IF NOT EXISTS "StockMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey StockMovement → Product
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StockMovement_productId_idx" ON "StockMovement"("productId");
CREATE INDEX IF NOT EXISTS "StockMovement_orderId_idx" ON "StockMovement"("orderId");
