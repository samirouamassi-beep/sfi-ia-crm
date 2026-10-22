-- AlterTable
ALTER TABLE "Projet" ADD COLUMN     "numeroMarche" TEXT;

-- CreateTable
CREATE TABLE "AppelOffre" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "maitreOuvrage" TEXT NOT NULL,
    "objet" TEXT NOT NULL,
    "procedure" TEXT NOT NULL,
    "activite" TEXT NOT NULL,
    "dateLimite" TIMESTAMP(3) NOT NULL,
    "montantEstime" DOUBLE PRECISION,
    "montantSoumis" DOUBLE PRECISION,
    "cautionProvisoire" DOUBLE PRECISION,
    "statut" TEXT NOT NULL,
    "responsableId" TEXT,
    "notes" TEXT,
    "projetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppelOffre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppelOffre_projetId_key" ON "AppelOffre"("projetId");

-- AddForeignKey
ALTER TABLE "AppelOffre" ADD CONSTRAINT "AppelOffre_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Membre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppelOffre" ADD CONSTRAINT "AppelOffre_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
