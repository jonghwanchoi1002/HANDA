import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { getDatabase } from "@/lib/content/database";
import AccountShell from "@/components/account-shell";
import MemberActions from "./member-actions";
import styles from "@/app/login/auth.module.css";
// 요청 시 DB 또는 세션을 확인하므로 서버 응답을 기다립니다.
export const instant = false;

export const metadata: Metadata = { title: "회원 승인 관리 | HANDA", robots: { index: false, follow: false } };
export default async function AdminPage() {
  await requireAdmin();
  const result = await getDatabase().query<{id:string;name:string;email:string;role:string;status:string;verified:boolean}>(`SELECT id,name,email,role,approval_status AS status,"emailVerified" AS verified FROM handa_auth_user ORDER BY CASE approval_status WHEN 'pending' THEN 0 ELSE 1 END, "createdAt" DESC LIMIT 100`);
  const labels: Record<string,string> = {pending:"승인 대기",approved:"이용 승인",rejected:"거절·이용 중지"};
  return <AccountShell wide><p className={styles.eyebrow}>HANDA ADMIN</p><h1>회원 승인 관리</h1><p className={styles.intro}>가입 신청을 확인하고 이용을 승인하거나 중지할 수 있습니다. 이메일 확인을 마친 회원만 승인할 수 있습니다.</p><p className={styles.help}>승인 대기 우선, 최근 가입자 최대 100명을 표시합니다. 일반 회원의 승인·거절은 이 화면에서 처리할 수 있습니다.</p><div className={styles.links}><Link href="/account">내 계정으로</Link><Link href="/wiki" prefetch={false}>비즈니스 위키</Link></div>
    <div className={styles.list}>{result.rows.map((user) => <article key={user.id} className={styles.member}><h2>{user.name}</h2><p>{user.email}</p><p>{user.role === "admin" ? "관리자" : "회원"} · {labels[user.status]} · {user.verified ? "이메일 확인 완료" : "이메일 미확인"}</p>{user.role === "member" ? <><MemberActions id={user.id} verified={user.verified} approved={user.status === "approved"} />{!user.verified && <p className={styles.help}>이메일 확인을 마치면 승인할 수 있습니다.</p>}</> : <p className={styles.help}>관리자 계정입니다. 회원 승인 대상이 아닙니다.</p>}</article>)}</div>
  </AccountShell>;
}
