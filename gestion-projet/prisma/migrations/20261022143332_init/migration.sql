-- CreateTable
CREATE TABLE "Membre" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL,
    "tauxJournalier" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "capaciteJours" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Membre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projet" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "client" TEXT,
    "description" TEXT,
    "chefId" TEXT,
    "statut" TEXT NOT NULL,
    "priorite" TEXT NOT NULL,
    "meteo" TEXT NOT NULL,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Projet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phase" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tache" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "phaseId" TEXT,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "responsableId" TEXT,
    "statut" TEXT NOT NULL,
    "priorite" TEXT NOT NULL,
    "jalon" BOOLEAN NOT NULL DEFAULT false,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "chargeJours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avancement" INTEGER NOT NULL DEFAULT 0,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Temps" (
    "id" TEXT NOT NULL,
    "membreId" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "tacheId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "jours" DOUBLE PRECISION NOT NULL,
    "note" TEXT,

    CONSTRAINT "Temps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Depense" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Depense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risque" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "probabilite" INTEGER NOT NULL DEFAULT 2,
    "impact" INTEGER NOT NULL DEFAULT 2,
    "statut" TEXT NOT NULL,
    "responsableId" TEXT,
    "mitigation" TEXT,
    "echeance" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Risque_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Membre_email_key" ON "Membre"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Projet_code_key" ON "Projet"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Temps_membreId_projetId_tacheId_date_key" ON "Temps"("membreId", "projetId", "tacheId", "date");

-- AddForeignKey
ALTER TABLE "Projet" ADD CONSTRAINT "Projet_chefId_fkey" FOREIGN KEY ("chefId") REFERENCES "Membre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Membre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Temps" ADD CONSTRAINT "Temps_membreId_fkey" FOREIGN KEY ("membreId") REFERENCES "Membre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Temps" ADD CONSTRAINT "Temps_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Temps" ADD CONSTRAINT "Temps_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "Tache"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Depense" ADD CONSTRAINT "Depense_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risque" ADD CONSTRAINT "Risque_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risque" ADD CONSTRAINT "Risque_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Membre"("id") ON DELETE SET NULL ON UPDATE CASCADE;
