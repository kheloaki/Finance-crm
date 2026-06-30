#!/usr/bin/env node
/**
 * Generates Convex Auth JWT keys and sets deployment env vars.
 * Usage: node scripts/setup-convex-auth-env.mjs [--env-file .env]
 */
import { execSync } from "child_process";
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const envFileFlag = process.argv.includes("--env-file")
  ? `--env-file ${process.argv[process.argv.indexOf("--env-file") + 1]}`
  : "--env-file .env";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

async function main() {
  const keys = await generateKeyPair("RS256");
  const privateKey = await exportPKCS8(keys.privateKey);
  const publicKey = await exportJWK(keys.publicKey);
  const jwtPrivateKey = privateKey.trimEnd().replace(/\n/g, " ");
  const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

  const vars = [
    ["SITE_URL", siteUrl],
    ["JWT_PRIVATE_KEY", jwtPrivateKey],
    ["JWKS", jwks],
  ];

  for (const [name, value] of vars) {
    const escaped = value.replace(/"/g, '\\"');
    console.log(`Setting ${name} on Convex deployment…`);
    execSync(`npx convex env set ${envFileFlag} -- ${name} "${escaped}"`, {
      stdio: "inherit",
    });
  }

  console.log("\nConvex Auth env vars configured successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
