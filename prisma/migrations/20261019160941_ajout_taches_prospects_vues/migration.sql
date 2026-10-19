-- CreateTable
CREATE TABLE "Tache" (
    "id" TEXT NOT NULL,
    "sujet" TEXT NOT NULL,
    "echeance" TIMESTAMP(3),
    "priorite" TEXT,
    "fondateur" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'À faire',
    "termineeLe" TIMESTAMP(3),
    "compteId" TEXT,
    "contactId" TEXT,
    "opportuniteId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "societe" TEXT NOT NULL,
    "fonction" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "linkedin" TEXT,
    "source" TEXT,
    "statut" TEXT NOT NULL,
    "fondateurReferent" TEXT,
    "notes" TEXT,
    "convertiLe" TIMESTAMP(3),
    "compteId" TEXT,
    "contactId" TEXT,
    "opportuniteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VueListe" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "requete" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VueListe_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "Compte"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_opportuniteId_fkey" FOREIGN KEY ("opportuniteId") REFERENCES "Opportunite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "Compte"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_opportuniteId_fkey" FOREIGN KEY ("opportuniteId") REFERENCES "Opportunite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
