import { loadEnvConfig } from "@next/env";
import { getDatabase, closeDatabase } from "../src/lib/content/database";

// next dev와 같은 환경 파일 우선순위를 사용합니다.
const config = loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
async function main() {
  console.log(`Environment files: ${config.loadedEnvFiles.map((file) => file.path).join(", ") || "process environment only"}`);
  const database = getDatabase();
  const tables = ["handa_auth_user", "handa_auth_session", "handa_auth_account", "handa_auth_verification", "handa_auth_rate_limit", "handa_membership_audit"];
  let missing = false;
  for (const table of tables) {
    const result = await database.query("SELECT to_regclass($1) IS NOT NULL AS present", [table]);
    const present = result.rows[0].present;
    console.log(`${table}: ${present ? "OK" : "MISSING"}`);
    if (!present) missing = true;
  }
  const history = await database.query("SELECT to_regclass('handa_schema_migrations') IS NOT NULL AS present");
  if (history.rows[0].present) {
    const applied = await database.query("SELECT name FROM handa_schema_migrations ORDER BY name");
    console.log(`Applied migrations: ${applied.rows.map((row: { name: string }) => row.name).join(", ") || "none"}`);
  } else { console.log("Applied migrations: history table missing"); }
  if (missing) { console.error("Auth tables are missing in the selected development database. Confirm DATABASE_URL, then run db:migrate and restart next dev."); process.exitCode = 1; }
  else console.log("Authentication tables are present. Restart next dev if a previous schema error remains cached.");
}
main().catch(() => { console.error("Authentication database check failed. Check DATABASE_URL and database access. Connection details are not printed."); process.exitCode = 1; }).finally(closeDatabase);
