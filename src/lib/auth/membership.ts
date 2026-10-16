import type { Pool } from "pg";
import { canManageMembers } from "./permissions";

export async function changeMembershipStatus(database: Pool, actorId: string, targetId: string, decision: "approved" | "rejected") {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const actor = await client.query(`SELECT role, approval_status AS "approvalStatus", "emailVerified" FROM handa_auth_user WHERE id=$1 FOR SHARE`, [actorId]);
    if (!canManageMembers(actor.rows[0] ?? null)) throw new Error("Administrator access required.");
    const target = await client.query(`SELECT role, approval_status, "emailVerified" FROM handa_auth_user WHERE id=$1 FOR UPDATE`, [targetId]);
    const user = target.rows[0];
    if (!user || user.role !== "member" || actorId === targetId) throw new Error("Only member applications can be changed here.");
    if (decision === "approved" && !user.emailVerified) throw new Error("Email must be verified before approval.");
    await client.query(`UPDATE handa_auth_user SET approval_status=$1, "updatedAt"=now() WHERE id=$2`, [decision,targetId]);
    await client.query(`INSERT INTO handa_membership_audit (actor_id,target_id,action,previous_status) VALUES ($1,$2,$3,$4)`, [actorId,targetId,decision,user.approval_status]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
