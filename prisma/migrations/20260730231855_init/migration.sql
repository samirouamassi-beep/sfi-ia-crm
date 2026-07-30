-- CreateTable
CREATE TABLE "Fondateur" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "Fondateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compte" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "secteur" TEXT,
    "statutRelation" TEXT NOT NULL,
    "priorite" TEXT NOT NULL,
    "fondateurReferent" TEXT,
    "contactPrincipal" TEXT,
    "origineRelation" TEXT,
    "statutReferencement" TEXT,
    "delaiPaiementJours" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Compte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "compteId" TEXT,
    "fonction" TEXT,
    "roleDecision" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "linkedin" TEXT,
    "fondateurReferent" TEXT,
    "priorite" TEXT,
    "relancePrevueLe" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunite" (
    "id" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "compteId" TEXT NOT NULL,
    "typeOffre" TEXT NOT NULL,
    "nbJoursOuPostes" DOUBLE PRECISION,
    "montant" DOUBLE PRECISION NOT NULL,
    "etape" TEXT NOT NULL,
    "dateClosingVisee" TIMESTAMP(3),
    "fondateurReferent" TEXT,
    "prochaineAction" TEXT,
    "echeanceProchaineAction" TIMESTAMP(3),
    "concurrenceIdentifiee" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ressource" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "typeContrat" TEXT NOT NULL,
    "entite" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "competencesSalesforce" TEXT,
    "certificationsDetenues" TEXT,
    "anneesExperience" DOUBLE PRECISION,
    "salaireBrutMensuel" DOUBLE PRECISION,
    "tjmAchat" DOUBLE PRECISION,
    "tjmVenteCible" DOUBLE PRECISION,
    "disponibleAPartirDe" TIMESTAMP(3),
    "sourceApporteur" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ressource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "compteId" TEXT NOT NULL,
    "mission" TEXT NOT NULL,
    "typeOffre" TEXT NOT NULL,
    "ressourceId" TEXT,
    "dateDebut" TIMESTAMP(3),
    "dateFinPrevue" TIMESTAMP(3),
    "joursFacturesParMois" DOUBLE PRECISION,
    "tjmVente" DOUBLE PRECISION,
    "tjmCoutAchat" DOUBLE PRECISION,
    "statut" TEXT NOT NULL,
    "fondateurReferent" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "compteId" TEXT,
    "contactId" TEXT,
    "type" TEXT NOT NULL,
    "fondateur" TEXT,
    "sujet" TEXT,
    "compteRendu" TEXT,
    "prochaineAction" TEXT,
    "echeance" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parametre" (
    "cle" TEXT NOT NULL,
    "valeur" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Parametre_pkey" PRIMARY KEY ("cle")
);

-- CreateTable
CREATE TABLE "EtapePipeline" (
    "etape" TEXT NOT NULL,
    "probabilite" DOUBLE PRECISION NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EtapePipeline_pkey" PRIMARY KEY ("etape")
);

-- CreateIndex
CREATE UNIQUE INDEX "Fondateur_nom_key" ON "Fondateur"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Compte_nom_key" ON "Compte"("nom");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "Compte"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunite" ADD CONSTRAINT "Opportunite_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "Compte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "Compte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_ressourceId_fkey" FOREIGN KEY ("ressourceId") REFERENCES "Ressource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "Compte"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
