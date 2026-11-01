import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID?.trim();
if (!databaseId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(databaseId)) {
  throw new Error("Set CLOUDFLARE_D1_DATABASE_ID to the UUID of your Cloudflare D1 database before deploying.");
}

const configPath = fileURLToPath(new URL("../dist/server/wrangler.json", import.meta.url));
let config;
try {
  config = JSON.parse(readFileSync(configPath, "utf8"));
} catch {
  throw new Error("Build the project with npm run build before deploying.");
}

const database = config.d1_databases?.find((entry) => entry.binding === "DB");
if (!database) throw new Error("The build did not produce the required DB binding.");

config.name = "heartbox";
database.database_id = databaseId;
database.database_name = process.env.CLOUDFLARE_D1_DATABASE_NAME?.trim() || "heartbox-db";
writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

const wranglerPath = fileURLToPath(new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url));
const result = spawnSync(process.execPath, [wranglerPath, "deploy", "--config", configPath, ...process.argv.slice(2)], {
  stdio: "inherit",
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
