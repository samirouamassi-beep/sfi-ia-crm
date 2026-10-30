import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // RETROVAULT_DATABASE_URL prime : une variable DATABASE_URL partagée par d'autres projets
    // de l'équipe Vercel ne doit jamais diriger les migrations vers leur base.
    url: process.env["RETROVAULT_DATABASE_URL"] ?? process.env["DATABASE_URL"],
  },
});
