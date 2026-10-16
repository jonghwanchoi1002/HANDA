import type { Pool } from "pg";
import { canManageMembers } from "./permissions";

export class MemberManagementError extends Error {}
type Change = { type: "status"; value: "approved" | "rejected" } | { type: "role"; value: "member" | "admin" };

async function changeMember(database: Pool, actorId: string, targetId: string, change: Change) {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    // 모든 권한 변경을 직렬화해 동시 해제 또는 승인과 승격의 충돌을 방지합니다.
    await client.query("SELECT pg_advisory_xact_lock(720241017)");
    const actor = await client.query(`SELECT role, approval_status AS "approvalStatus", "emailVerified" FROM handa_auth_user WHERE id=$1 FOR SHARE`, [actorId]);
    if (!canManageMembers(actor.rows[0] ?? null)) throw new MemberManagementError("관리자 권한이 필요합니다.");
    const target = await client.query(`SELECT role, approval_status, "emailVerified" FROM handa_auth_user WHERE id=$1 FOR UPDATE`, [targetId]);
    const user = target.rows[0];
    if (!user) throw new MemberManagementError("회원을 찾을 수 없습니다.");
    let role = user.role;
    let status = user.approval_status;
    let action: string;
    if (change.type === "status") {
      if (role !== "member" || actorId === targetId) throw new MemberManagementError("관리자의 이용 상태는 직접 변경할 수 없습니다. 먼저 다른 관리자가 권한을 해제해야 합니다.");
      if (change.value === "approved" && !user.emailVerified) throw new MemberManagementError("이메일 확인을 마친 회원만 승인할 수 있습니다.");
      status = change.value; action = change.value;
    } else {
      if (role === change.value) throw new MemberManagementError("이미 같은 권한입니다. 목록을 새로 확인해 주세요.");
      if (change.value === "admin") {
        if (!user.emailVerified || status !== "approved") throw new MemberManagementError("이메일 확인과 이용 승인을 마친 회원만 관리자로 지정할 수 있습니다.");
        role = "admin"; action = "grant_admin";
      } else {
        const admins = await client.query(`SELECT count(*)::int AS count FROM handa_auth_user WHERE role='admin' AND approval_status='approved' AND "emailVerified"=true`);
        if (admins.rows[0].count <= 1) throw new MemberManagementError("마지막 관리자의 권한은 해제할 수 없습니다.");
        if (actorId === targetId) throw new MemberManagementError("본인의 관리자 권한은 다른 관리자에게 해제를 요청해 주세요.");
        role = "member"; action = "revoke_admin";
      }
    }
    await client.query(`UPDATE handa_auth_user SET role=$1,approval_status=$2,"updatedAt"=now() WHERE id=$3`, [role,status,targetId]);
    await client.query(`INSERT INTO handa_membership_audit (actor_id,target_id,action,previous_status,previous_role,new_role,new_status) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [actorId,targetId,action,user.approval_status,user.role,role,status]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
export function changeMembershipStatus(database: Pool, actorId: string, targetId: string, decision: "approved" | "rejected") {
  return changeMember(database,actorId,targetId,{type:"status",value:decision});
}
export function changeMemberRole(database: Pool, actorId: string, targetId: string, role: "member" | "admin") {
  return changeMember(database,actorId,targetId,{type:"role",value:role});
}
