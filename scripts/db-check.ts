import { loadEnvConfig } from "@next/env";
import { getDatabase, closeDatabase } from "../src/lib/content/database";
import { readPublishedContent } from "../src/lib/content/repository";
import { contentSchemas } from "../src/lib/content/schema";
import type { ContentKind } from "../src/lib/content/schema";

loadEnvConfig(process.cwd());
async function main() {
  const database = getDatabase();
  await database.query("SELECT 1");
  for (const kind of Object.keys(contentSchemas) as ContentKind[]) {
    const entries = await readPublishedContent((sql, values) => database.query(sql, values), kind);
    if (kind === "home" && entries.length !== 1) throw new Error("Initialize homepage content first.");
    console.log(`${kind}: ${entries.length} valid published entries`);
  }
  console.log("Database connection and public content validation passed.");
}
main().catch(() => { console.error("Database check failed. Confirm DATABASE_URL and run db:migrate and db:seed. Connection details are not printed."); process.exitCode = 1; }).finally(closeDatabase);
