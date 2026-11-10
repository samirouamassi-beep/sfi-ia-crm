-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('BOOLEAN', 'SELECT', 'TEXT', 'NUMBER');

-- AlterTable
ALTER TABLE "Platform" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ItemAttribute" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "type" "AttributeType" NOT NULL,
    "options" TEXT[],
    "kinds" "ProductKind"[],
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemAttributeValue" (
    "itemId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ItemAttributeValue_pkey" PRIMARY KEY ("itemId","attributeId")
);

-- CreateIndex
CREATE INDEX "ItemAttribute_userId_idx" ON "ItemAttribute"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemAttribute_userId_label_key" ON "ItemAttribute"("userId", "label");

-- CreateIndex
CREATE INDEX "ItemAttributeValue_attributeId_idx" ON "ItemAttributeValue"("attributeId");

-- AddForeignKey
ALTER TABLE "ItemAttribute" ADD CONSTRAINT "ItemAttribute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAttributeValue" ADD CONSTRAINT "ItemAttributeValue_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CollectionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAttributeValue" ADD CONSTRAINT "ItemAttributeValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "ItemAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
