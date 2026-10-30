// Relevé des cotes en ligne de commande (cron système, GitHub Actions…) :
//   npm run prices:refresh
// Équivalent de GET /api/prices/refresh, sans passer par HTTP.

import "dotenv/config";

async function main() {
  // Lancé avec --conditions=react-server (cf. package.json) pour que "server-only" l'accepte.
  const { refreshAllPrices } = await import("../src/lib/pricing");
  const report = await refreshAllPrices();
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
