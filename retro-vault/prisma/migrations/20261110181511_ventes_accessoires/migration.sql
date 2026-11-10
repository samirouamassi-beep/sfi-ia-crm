-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('OWNED', 'FOR_SALE', 'SOLD');

-- AlterTable
ALTER TABLE "CollectionItem" ADD COLUMN     "askingPriceCents" INTEGER,
ADD COLUMN     "saleChannel" TEXT,
ADD COLUMN     "saleFeesCents" INTEGER,
ADD COLUMN     "salePriceCents" INTEGER,
ADD COLUMN     "soldAt" DATE,
ADD COLUMN     "status" "ItemStatus" NOT NULL DEFAULT 'OWNED';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "accessoryTypeId" TEXT;

-- CreateTable
CREATE TABLE "AccessoryType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessoryType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessoryType_name_key" ON "AccessoryType"("name");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_accessoryTypeId_fkey" FOREIGN KEY ("accessoryTypeId") REFERENCES "AccessoryType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
