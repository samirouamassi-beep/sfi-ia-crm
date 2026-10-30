-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('GAME', 'CONSOLE', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('PAL', 'NTSC_U', 'NTSC_J', 'OTHER');

-- CreateEnum
CREATE TYPE "Completeness" AS ENUM ('LOOSE', 'CIB', 'SEALED');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('POOR', 'GOOD', 'VERY_GOOD', 'MINT');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "releaseYear" INTEGER,
    "igdbId" INTEGER,
    "priceChartingName" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "kind" "ProductKind" NOT NULL DEFAULT 'GAME',
    "title" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "igdbId" INTEGER,
    "coverUrl" TEXT,
    "releaseYear" INTEGER,
    "developer" TEXT,
    "publisher" TEXT,
    "genres" TEXT[],
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceSourceLink" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "provider" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceSourceLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceSnapshot" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "capturedAt" DATE NOT NULL,
    "looseCents" INTEGER,
    "cibCents" INTEGER,
    "sealedCents" INTEGER,
    "boxOnlyCents" INTEGER,
    "manualOnlyCents" INTEGER,
    "source" TEXT NOT NULL,

    CONSTRAINT "PriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "productId" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "completeness" "Completeness" NOT NULL,
    "boxGrade" "Grade",
    "manualGrade" "Grade",
    "mediaGrade" "Grade",
    "boxScore" INTEGER,
    "manualScore" INTEGER,
    "mediaScore" INTEGER,
    "acquiredAt" DATE,
    "purchaseCents" INTEGER,
    "manualValueCents" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPhoto" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "productId" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "completeness" "Completeness" NOT NULL DEFAULT 'CIB',
    "targetPriceCents" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_slug_key" ON "Platform"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_igdbId_key" ON "Platform"("igdbId");

-- CreateIndex
CREATE INDEX "Product_title_idx" ON "Product"("title");

-- CreateIndex
CREATE INDEX "Product_platformId_idx" ON "Product"("platformId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_igdbId_platformId_key" ON "Product"("igdbId", "platformId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceSourceLink_productId_region_provider_key" ON "PriceSourceLink"("productId", "region", "provider");

-- CreateIndex
CREATE INDEX "PriceSnapshot_productId_region_capturedAt_idx" ON "PriceSnapshot"("productId", "region", "capturedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PriceSnapshot_productId_region_capturedAt_key" ON "PriceSnapshot"("productId", "region", "capturedAt");

-- CreateIndex
CREATE INDEX "CollectionItem_userId_idx" ON "CollectionItem"("userId");

-- CreateIndex
CREATE INDEX "CollectionItem_productId_idx" ON "CollectionItem"("productId");

-- CreateIndex
CREATE INDEX "ItemPhoto_itemId_idx" ON "ItemPhoto"("itemId");

-- CreateIndex
CREATE INDEX "WishlistItem_userId_idx" ON "WishlistItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_userId_productId_region_completeness_key" ON "WishlistItem"("userId", "productId", "region", "completeness");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceSourceLink" ADD CONSTRAINT "PriceSourceLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceSnapshot" ADD CONSTRAINT "PriceSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPhoto" ADD CONSTRAINT "ItemPhoto_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CollectionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
