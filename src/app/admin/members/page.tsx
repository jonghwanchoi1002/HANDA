import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { getDatabase } from "@/lib/content/database";
import { listManagedMembers, type MemberFilter } from "@/lib/auth/member-list";
import AccountShell from "@/components/account-shell";
import MemberActions from "../member-actions";
import RoleActions from "../role-actions";
import styles from "@/app/login/auth.module.css";
import management from "./members.module.css";

export const instant = false;
export const metadata: Metadata = { title: "회원 관리 | HANDA", robots: { index: false, follow: false } };
export default async function MembersAdminPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const admin = await requireAdmin();
  const parameters = await searchParams;
  const string = (key: string) => typeof parameters[key] === "string" ? parameters[key] as string : "";
  const status = string("status"); const role = string("role");
  const filter: MemberFilter = { query:string("q").trim().slice(0,200),status:["pending","approved","rejected"].includes(status)?status as MemberFilter["status"]:"all",role:["admin","member"].includes(role)?role as MemberFilter["role"]:"all",page:Math.min(100000,Math.max(1,Number.parseInt(string("page"),10)||1)) };
  const result = await listManagedMembers(getDatabase(),filter);
  const labels: Record<string,string> = {pending:"승인 대기",approved:"이용 승인",rejected:"거절·이용 중지"};
  const pageURL = (page:number) => `/admin/members?${new URLSearchParams({q:filter.query,status:filter.status,role:filter.role,page:String(page)})}`;
  return <AccountShell wide><p className={styles.eyebrow}>HANDA ADMIN</p><h1>회원 관리</h1><p className={styles.intro}>가입 회원을 검색하고 이용 승인과 관리자 권한을 관리합니다.</p><div className={styles.links}><Link href="/account">내 계정으로</Link><Link href="/wiki" prefetch={false}>비즈니스 위키</Link></div>
    <form action="/admin/members" className={management.filters}>
      <label>이름 또는 이메일<input type="search" name="q" defaultValue={filter.query} placeholder="회원 검색" maxLength={200}/></label>
      <label>이용 상태<select name="status" defaultValue={filter.status}><option value="all">전체 상태</option><option value="pending">승인 대기</option><option value="approved">이용 승인</option><option value="rejected">거절·이용 중지</option></select></label>
      <label>권한<select name="role" defaultValue={filter.role}><option value="all">전체 권한</option><option value="member">일반 회원</option><option value="admin">관리자</option></select></label>
      <button className={`${styles.button} ${styles.primary}`}>검색</button><Link href="/admin/members">초기화</Link>
    </form>
    <p className={styles.help}>검색 결과 {result.total}명 · {result.page} / {result.pages}페이지 · 승인 대기 우선 · 페이지당 20명</p>
    <div className={styles.list}>{result.members.map((user) => <article key={user.id} className={styles.member}>
      <div className={management.memberHeading}><h2>{user.name}</h2><span className={management.badge}>{user.role === "admin" ? "관리자" : "일반 회원"}</span></div><p>{user.email}</p><p>{labels[user.status]} · {user.verified ? "이메일 확인 완료" : "이메일 미확인"}</p><p className={styles.help}>가입일 {new Intl.DateTimeFormat("ko-KR",{dateStyle:"medium",timeZone:"Europe/Berlin"}).format(user.createdAt)}</p>
      <div className={management.controls}>{user.role === "member" && <MemberActions id={user.id} verified={user.verified} approved={user.status === "approved"}/>}
      <RoleActions id={user.id} name={user.name} role={user.role} eligible={user.role === "admin" || user.verified && user.status === "approved"} self={user.id===admin.id}/></div>
      {user.role === "member" && !user.verified && <p className={styles.help}>이메일 확인을 마치면 이용을 승인할 수 있습니다.</p>}
    </article>)}</div>
    {!result.members.length && <div className={styles.box}><h2>조건에 맞는 회원이 없습니다.</h2><p className={styles.intro}>검색어나 필터를 바꿔보세요.</p></div>}
    <nav className={management.pagination} aria-label="회원 목록 페이지">{result.page>1 && <Link href={pageURL(result.page-1)}>← 이전</Link>}<span>{result.page} / {result.pages}</span>{result.page<result.pages && <Link href={pageURL(result.page+1)}>다음 →</Link>}</nav>
    <p className={styles.help}>관리자 승격은 이메일 확인과 이용 승인이 끝난 회원에게만 가능합니다. 마지막 관리자와 본인의 권한 해제는 제한됩니다.</p>
  </AccountShell>;
}
