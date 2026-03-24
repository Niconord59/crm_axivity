/**
 * Script utilitaire pour générer une API Key MCP.
 *
 * Usage:
 *   npx tsx scripts/generate-api-key.ts <user_id> <label>
 *
 * Exemple:
 *   npx tsx scripts/generate-api-key.ts "abc-123-uuid" "Claude Desktop - Pierre"
 *
 * Le script affiche:
 *   1. La clé brute (à donner à l'utilisateur — elle ne sera plus jamais visible)
 *   2. La requête SQL INSERT à exécuter dans Supabase
 */

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function main() {
  const userId = process.argv[2];
  const label = process.argv[3] || "MCP Key";

  if (!userId) {
    console.error("Usage: npx tsx scripts/generate-api-key.ts <user_id> [label]");
    console.error('Example: npx tsx scripts/generate-api-key.ts "abc-123" "Claude Desktop - Pierre"');
    process.exit(1);
  }

  const rawKey = `axv_${crypto.randomUUID().replace(/-/g, "")}`;
  const keyHash = await hashKey(rawKey);

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║            MCP API KEY GENERATED                        ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  Raw Key (SAVE THIS — shown only once):                 ║`);
  console.log(`║  ${rawKey}`);
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  User ID: ${userId}`);
  console.log(`║  Label:   ${label}`);
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("\n── SQL à exécuter dans Supabase SQL Editor ──\n");
  console.log(`INSERT INTO mcp_api_keys (user_id, label, key_hash)`);
  console.log(`VALUES (`);
  console.log(`  '${userId}',`);
  console.log(`  '${label}',`);
  console.log(`  '${keyHash}'`);
  console.log(`);`);
  console.log("\n── Fin ──\n");
}

main();
