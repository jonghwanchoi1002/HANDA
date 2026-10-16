import Link from "next/link";
import AccountShell from "@/components/account-shell";
import { requireAdmin } from "@/lib/auth/session";
import { getDatabase } from "@/lib/content/database";
import { kindSchema, labels } from "@/lib/content/management";
import common from "@/app/login/auth.module.css";
import styles from "./content.module.css";
export const instant = false;
export const metadata = {title:"콘텐츠 관리 | HANDA",robots:{index:false,follow:false}};
export default async function ContentList({searchParams}:{searchParams:Promise<{kind?:string;q?:string;status?:string;page?:string;saved?:string}>}) {
  await requireAdmin();
  const params=await searchParams;
  const kind=kindSchema.safeParse(params.kind).data ?? "wiki";
  const q=(params.q ?? "").trim().slice(0,100);
  const status=["draft","published"].includes(params.status ?? "") ? params.status! : "";
  const values=[kind,q,status];
  const where="kind=$1 AND ($2='' OR position(lower($2) in lower(COALESCE(payload->>'title',payload->>'name',payload->>'heroTitle',''))) > 0) AND ($3='' OR status=$3)";
  const count=await getDatabase().query(`SELECT count(*)::int AS count FROM handa_content WHERE ${where}`,values);
  const total=count.rows[0].count;const pages=Math.max(1,Math.ceil(total/20));
  const page=Math.min(pages,Math.max(1,Number.parseInt(params.page ?? "1",10)||1));
  const result=await getDatabase().query(`SELECT content_key,payload,status,updated_at FROM handa_content WHERE ${where} ORDER BY updated_at DESC,content_key LIMIT 20 OFFSET $4`,[...values,(page-1)*20]);
  const pageURL=(number:number)=>`/admin/content?${new URLSearchParams({kind,q,status,page:String(number)})}`;
  return <AccountShell wide><p className={common.eyebrow}>HANDA ADMIN</p><h1>콘텐츠 관리</h1><p className={common.intro}>글을 작성하거나 수정하고, 임시 저장과 공개 상태를 관리합니다.</p>
    <nav aria-label="콘텐츠 종류" className={styles.tabs}>{kindSchema.options.map(item=><Link key={item} href={`/admin/content?kind=${item}`} aria-current={kind===item?"page":undefined}>{labels[item]}</Link>)}</nav>
    {params.saved === "1" && <p role="status" className={styles.result}>저장했습니다.</p>}
    <form className={styles.toolbar}><input type="hidden" name="kind" value={kind}/><label>제목 또는 이름<input name="q" defaultValue={q} maxLength={100}/></label><label>공개 상태<select name="status" defaultValue={status}><option value="">전체</option><option value="draft">임시 저장</option><option value="published">공개</option></select></label><button className={`${common.button} ${common.primary}`}>검색</button>{kind!=="home" && <Link className={common.button} href={`/admin/content/${kind}/new`}>새 글 작성</Link>}</form>
    <p className={styles.help}>총 {total}개 · {page} / {pages}페이지</p>
    <div className={styles.entries}>{result.rows.map(row=><article key={row.content_key} className={styles.entry}><div><h2>{row.payload.title ?? row.payload.name ?? "홈 소개 문구"}</h2><p>{row.status==="published"?"공개":"임시 저장"} · 수정일 {new Date(row.updated_at).toLocaleDateString("ko-KR",{timeZone:"Europe/Berlin"})}</p></div><Link href={`/admin/content/${kind}/${row.content_key}`}>수정</Link></article>)}</div>
    {!total && <p>등록된 콘텐츠가 없습니다.</p>}
    <nav aria-label="콘텐츠 목록 페이지" className={styles.pagination}>{page>1 && <Link href={pageURL(page-1)}>이전</Link>}{page<pages && <Link href={pageURL(page+1)}>다음</Link>}</nav>
  </AccountShell>;
}
