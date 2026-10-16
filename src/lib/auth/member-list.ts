import type { Pool } from "pg";

export type MemberFilter = { query: string; status: "all" | "pending" | "approved" | "rejected"; role: "all" | "member" | "admin"; page: number };
export type ManagedMember = { id: string; name: string; email: string; role: string; status: string; verified: boolean; createdAt: Date };
const pageSize = 20;
export async function listManagedMembers(database: Pool, filter: MemberFilter) {
  const where = `($1='' OR position(lower($1) in lower(name))>0 OR position(lower($1) in lower(email))>0)
    AND ($2='all' OR approval_status=$2) AND ($3='all' OR role=$3)`;
  const values = [filter.query,filter.status,filter.role];
  const counts = await database.query<{ total: number }>(`SELECT count(*)::int AS total FROM handa_auth_user WHERE ${where}`,values);
  const total = counts.rows[0].total;
  const pages = Math.max(1,Math.ceil(total/pageSize));
  const page = Math.min(pages,Math.max(1,filter.page));
  const result = await database.query<ManagedMember>(`SELECT id,name,email,role,approval_status AS status,"emailVerified" AS verified,"createdAt"
    FROM handa_auth_user WHERE ${where} ORDER BY CASE approval_status WHEN 'pending' THEN 0 ELSE 1 END,"createdAt" DESC,id ASC LIMIT $4 OFFSET $5`,[...values,pageSize,(page-1)*pageSize]);
  return {members:result.rows,total,pages,page};
}
