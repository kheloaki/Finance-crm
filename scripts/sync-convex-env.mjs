#!/usr/bin/env node
/**
 * Merges Convex deployment vars from `.env.local` (written by `convex dev`) into `.env`,
 * then removes `.env.local` so Next.js uses a single env file.
 *
 * Usage: node scripts/sync-convex-env.mjs
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");
const localPath = resolve(root, ".env.local");

const CONVEX_KEYS = [
  "CONVEX_DEPLOYMENT",
  "NEXT_PUBLIC_CONVEX_URL",
  "NEXT_PUBLIC_CONVEX_SITE_URL",
];

function parseEnv(content) {
  const map = new Map();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    const commentIdx = value.indexOf(" #");
    if (commentIdx !== -1) value = value.slice(0, commentIdx).trim();
    map.set(key, value);
  }
  return map;
}

function upsertEnvLines(content, updates) {
  const lines = content.split("\n");
  const seen = new Set();

  const next = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;
    const eq = trimmed.indexOf("=");
    if (eq === -1) return line;
    const key = trimmed.slice(0, eq).trim();
    if (!updates.has(key)) return line;
    seen.add(key);
    return `${key}=${updates.get(key)}`;
  });

  for (const [key, value] of updates) {
    if (!seen.has(key)) {
      next.push(`${key}=${value}`);
    }
  }

  return next.join("\n").replace(/\n*$/, "\n");
}

function main() {
  if (!existsSync(localPath)) {
    console.log("No .env.local — nothing to sync.");
    return;
  }

  const localVars = parseEnv(readFileSync(localPath, "utf8"));
  const updates = new Map();
  for (const key of CONVEX_KEYS) {
    const value = localVars.get(key);
    if (value) updates.set(key, value);
  }

  if (updates.size === 0) {
    console.log(".env.local has no Convex deployment vars — skipped.");
    return;
  }

  const envContent = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  writeFileSync(envPath, upsertEnvLines(envContent, updates));
  unlinkSync(localPath);

  console.log("Synced to .env:");
  for (const [key, value] of updates) {
    console.log(`  ${key}=${value}`);
  }
  console.log("Removed .env.local (Next.js will read .env only).");
  console.log("\nRun `npm run auth:setup` if this is a new deployment.");
}

main();
