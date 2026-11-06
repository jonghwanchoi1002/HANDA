import { profileVisibilitySchema, type ProfileVisibility } from "./profile-visibility";
import type { Pool } from "pg";
import { canReadWiki } from "./permissions";
export class AccountProfileError extends Error {}
export type AccountProfile={id:string;name:string;email:string;image:string|null;googleLinked:boolean;hasPassword:boolean;role:string;approvalStatus:string;emailVerified:boolean;profileVisibility:ProfileVisibility;joinedAt:Date};
export async function getAccountProfile(database:Pool,id:string):Promise<AccountProfile|null>{
  const result=await database.query<AccountProfile>(`SELECT u.id,u.name,u.email,u.image,u.role,u.approval_status AS "approvalStatus",u."emailVerified",u.profile_visibility AS "profileVisibility",u."createdAt" AS "joinedAt",
    EXISTS(SELECT 1 FROM handa_auth_account a WHERE a."userId"=u.id AND a."providerId"='google') AS "googleLinked",
    EXISTS(SELECT 1 FROM handa_auth_account a WHERE a."userId"=u.id AND a."providerId"='credential' AND a.password IS NOT NULL) AS "hasPassword"
    FROM handa_auth_user u WHERE u.id=$1`,[id]);
  return result.rows[0]??null;
}
export async function getApprovalNotice(database:Pool,id:string):Promise<number|null>{
  const row=(await database.query(`SELECT role,approval_status AS "approvalStatus","emailVerified",approval_notice_version AS version,approval_notice_seen_version AS seen FROM handa_auth_user WHERE id=$1`,[id])).rows[0];
  return row&&canReadWiki(row)&&row.version>row.seen?row.version:null;
}
export async function acknowledgeApprovalNotice(database:Pool,id:string,version:number){
  if(!Number.isSafeInteger(version)||version<1)throw new AccountProfileError("승인 안내를 다시 확인해 주세요.");
  const result=await database.query(`UPDATE handa_auth_user SET approval_notice_seen_version=$2
    WHERE id=$1 AND approval_status='approved' AND "emailVerified"=true AND role IN ('member','admin') AND approval_notice_version=$2 RETURNING id`,[id,version]);
  if(!result.rows.length)throw new AccountProfileError("승인 상태가 변경되었습니다. 새로고침 후 다시 확인해 주세요.");
}

export async function updateProfileVisibility(database:Pool,id:string,value:unknown):Promise<ProfileVisibility>{
  const parsed=profileVisibilitySchema.safeParse(value);
  if(!parsed.success)throw new AccountProfileError("공개 범위를 다시 선택해 주세요.");
  const result=await database.query(`UPDATE handa_auth_user SET profile_visibility=$2,"updatedAt"=now()
    WHERE id=$1 AND approval_status='approved' AND "emailVerified"=true AND role IN ('member','admin') RETURNING profile_visibility`,[id,parsed.data]);
  if(!result.rows.length)throw new AccountProfileError("이용 승인 후 공개 범위를 변경할 수 있습니다.");
  return parsed.data;
}
