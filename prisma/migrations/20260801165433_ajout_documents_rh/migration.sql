-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fondateurId" TEXT,
    "ressourceId" TEXT,
    "creePar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_fondateurId_fkey" FOREIGN KEY ("fondateurId") REFERENCES "Fondateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ressourceId_fkey" FOREIGN KEY ("ressourceId") REFERENCES "Ressource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
