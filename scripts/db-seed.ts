import { loadEnvConfig } from "@next/env";
import { getDatabase, closeDatabase } from "../src/lib/content/database";
import { getInitialContent } from "../src/lib/content/initial";
import { parseContent } from "../src/lib/content/schema";

loadEnvConfig(process.cwd());
async function main() {
  const entries = getInitialContent();
  const client = await getDatabase().connect();
  let added = 0;
  try {
    await client.query("BEGIN");
    for (const entry of entries) {
      const payload = parseContent(entry.kind, entry.payload);
      const isExample = "isExample" in payload && payload.isExample;
      const result = await client.query(`INSERT INTO handa_content
        (kind, content_key, payload, status, is_example, publication_consent, sort_order)
        VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7) ON CONFLICT (kind, content_key) DO NOTHING`,
      [entry.kind, entry.key, JSON.stringify(payload), entry.status, isExample, entry.consent, entry.order]);
      added += result.rowCount ?? 0;
    }
    await client.query("COMMIT"); console.log(`Added ${added} content entries. Existing content was preserved.`);
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
main().catch(() => { console.error("Content initialization failed. Check database setup and content validation. Connection details are not printed."); process.exitCode = 1; }).finally(closeDatabase);
