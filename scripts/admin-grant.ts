import { loadEnvConfig } from "@next/env";
import { getDatabase, closeDatabase } from "../src/lib/content/database";
import { z } from "zod";
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
async function main() {
  const email = z.email().parse(process.argv[2]?.trim().toLowerCase());
  const client = await getDatabase().connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(`SELECT id,approval_status,"emailVerified" FROM handa_auth_user WHERE lower(email)=$1 FOR UPDATE`, [email]);
    if (result.rows.length !== 1 || !result.rows[0].emailVerified) throw new Error("A verified account is required.");
    const user = result.rows[0];
    await client.query(`UPDATE handa_auth_user SET role='admin',approval_status='approved',"updatedAt"=now() WHERE id=$1`, [user.id]);
    await client.query(`INSERT INTO handa_membership_audit(actor_id,target_id,action,previous_status) VALUES ($1,$1,'grant_admin',$2)`, [user.id,user.approval_status]);
    await client.query("COMMIT"); console.log("Administrator granted to the verified account in the selected database.");
  } catch(error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}
main().catch(()=>{console.error("Admin setup failed. Supply the email of an existing verified account and confirm the selected database. No account was auto-created.");process.exitCode=1;}).finally(closeDatabase);
