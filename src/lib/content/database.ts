import { Pool } from "pg";

let pool: Pool | undefined;

// 서버 코드와 명령행 스크립트에서만 사용합니다. 이 모듈을 클라이언트에 가져오지 마세요.
export function getDatabase(): Pool {
  if (pool) return pool;
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is not configured.");
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("DATABASE_URL must be a PostgreSQL connection URL."); }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("DATABASE_URL must use PostgreSQL.");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (!local) {
    // Neon의 sslmode=require보다 강한 인증서·호스트 검증을 유지합니다.
    for (const name of ["sslcert", "sslkey", "sslrootcert", "uselibpqcompat"]) url.searchParams.delete(name);
    url.searchParams.set("sslmode", "verify-full");
  }
  pool = new Pool({ connectionString: url.toString(), max: 3, connectionTimeoutMillis: 10000, idleTimeoutMillis: 20000, enableChannelBinding: true, application_name: "handa" });
  pool.on("error", () => { console.error("HANDA database connection error. Check the database service and configuration."); });
  return pool;
}

export async function closeDatabase() {
  if (pool) { await pool.end(); pool = undefined; }
}
