import { statusLabels, type ContentStatus } from "@/lib/content/status";
import Link from "next/link";
import AccountShell from "@/components/account-shell";
import { requireWikiMember } from "@/lib/auth/session";
import { getDatabase } from "@/lib/content/database";
import common from "@/app/login/auth.module.css";
import styles from "@/app/admin/content/content.module.css";
export const instant=false;
export const metadata={title:"내 위키 글 | HANDA",robots:{index:false,follow:false}};
export default async function MyWiki({searchParams}:{searchParams:Promise<{page?:string}>}){
  const user=await requireWikiMember();const input=await searchParams;
  const total=(await getDatabase().query("SELECT count(*)::int AS count FROM handa_content WHERE kind='wiki' AND author_id=$1",[user.id])).rows[0].count;
  const pages=Math.max(1,Math.ceil(total/20));const page=Math.min(pages,Math.max(1,parseInt(input.page??"1",10)||1));
  const rows=(await getDatabase().query("SELECT content_key,payload,status FROM handa_content WHERE kind='wiki' AND author_id=$1 ORDER BY updated_at DESC,content_key LIMIT 20 OFFSET $2",[user.id,(page-1)*20])).rows;
  return <AccountShell wide><p className={common.eyebrow}>MY WIKI</p><h1>내가 쓴 글</h1><div className={common.links}><Link href="/wiki/new">새 글 작성</Link><Link href="/wiki">위키 목록</Link></div><p>{total}개의 글 · {page} / {pages}페이지</p><div className={styles.entries}>{rows.map(row=><article key={row.content_key} className={styles.entry}><div><h2>{row.payload.title}</h2><p>{statusLabels[row.status as ContentStatus]}</p></div><Link href={`/wiki/${row.content_key}/edit`}>수정</Link></article>)}</div>{!total&&<p>아직 작성한 글이 없습니다.</p>}<nav className={styles.pagination} aria-label="내 글 페이지">{page>1&&<Link href={`/account/posts?page=${page-1}`}>이전</Link>}{page<pages&&<Link href={`/account/posts?page=${page+1}`}>다음</Link>}</nav></AccountShell>;
}
