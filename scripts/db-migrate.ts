import { loadEnvConfig } from "@next/env";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { getDatabase, closeDatabase } from "../src/lib/content/database";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
async function main() {
  const client = await getDatabase().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(720241016)");
    await client.query("CREATE TABLE IF NOT EXISTS handa_schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())");
    const directory = new URL("../database/migrations/", import.meta.url);
    for (const name of (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort()) {
      const sql = await readFile(new URL(name, directory), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const existing = await client.query("SELECT checksum FROM handa_schema_migrations WHERE name = $1", [name]);
      if (existing.rows.length) {
        if (existing.rows[0].checksum !== checksum) throw new Error("Migration checksum mismatch. Do not edit applied migrations.");
        console.log(`Already applied: ${name}`); continue;
      }
      await client.query(sql);
      await client.query("INSERT INTO handa_schema_migrations (name, checksum) VALUES ($1, $2)", [name, checksum]);
      console.log(`Applied: ${name}`);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK"); throw error;
  } finally { client.release(); }
}
main().catch(() => {
  console.error("Database migration failed. Check DATABASE_URL, database access, and migration history. Connection details are not printed.");
  process.exitCode = 1;
}).finally(closeDatabase);
