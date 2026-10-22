-- AlterTable
ALTER TABLE "AppelOffre" ADD COLUMN     "tauxTva" DOUBLE PRECISION NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "Projet" ADD COLUMN     "baselineLe" TIMESTAMP(3),
ADD COLUMN     "tauxTva" DOUBLE PRECISION NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "Tache" ADD COLUMN     "baselineCharge" DOUBLE PRECISION,
ADD COLUMN     "baselineDebut" TIMESTAMP(3),
ADD COLUMN     "baselineFin" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Dependance" (
    "id" TEXT NOT NULL,
    "predecesseurId" TEXT NOT NULL,
    "successeurId" TEXT NOT NULL,

    CONSTRAINT "Dependance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caution" (
    "id" TEXT NOT NULL,
    "appelOffreId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "banque" TEXT,
    "reference" TEXT,
    "dateEmission" TIMESTAMP(3),
    "dateEcheance" TIMESTAMP(3),
    "statut" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Caution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dependance_predecesseurId_successeurId_key" ON "Dependance"("predecesseurId", "successeurId");

-- AddForeignKey
ALTER TABLE "Dependance" ADD CONSTRAINT "Dependance_predecesseurId_fkey" FOREIGN KEY ("predecesseurId") REFERENCES "Tache"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dependance" ADD CONSTRAINT "Dependance_successeurId_fkey" FOREIGN KEY ("successeurId") REFERENCES "Tache"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caution" ADD CONSTRAINT "Caution_appelOffreId_fkey" FOREIGN KEY ("appelOffreId") REFERENCES "AppelOffre"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Reprise des cautions provisoires saisies sur les appels d'offres avant de supprimer la colonne.
INSERT INTO "Caution" ("id", "appelOffreId", "type", "montant", "statut")
SELECT 'mig_' || "id", "id", 'Provisoire', "cautionProvisoire",
  CASE WHEN "statut" IN ('Perdu', 'Abandonné') THEN 'Restituée' ELSE 'Déposée' END
FROM "AppelOffre"
WHERE "cautionProvisoire" IS NOT NULL AND "cautionProvisoire" > 0;

ALTER TABLE "AppelOffre" DROP COLUMN "cautionProvisoire";
