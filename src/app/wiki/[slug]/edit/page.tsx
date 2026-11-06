import { notFound } from "next/navigation";
import AccountShell from "@/components/account-shell";
import { requireWikiMember } from "@/lib/auth/session";
import { canManageMembers } from "@/lib/auth/permissions";
import { getDatabase } from "@/lib/content/database";
import type { ManagedContent } from "@/lib/content/management";
import ContentEditor from "@/app/admin/content/editor";
import styles from "@/app/login/auth.module.css";
export const instant=false;
export const metadata={title:"위키 글 수정 | HANDA",robots:{index:false,follow:false}};
export default async function EditWiki({params}:{params:Promise<{slug:string}>}){
  const user=await requireWikiMember();const slug=(await params).slug;
  const row=(await getDatabase().query('SELECT kind,content_key AS key,payload,status,publication_consent AS consent,sort_order AS "order",revision,author_id FROM handa_content WHERE kind=\'wiki\' AND content_key=$1',[slug])).rows[0];
  if(!row||(!canManageMembers(user)&&row.author_id!==user.id))notFound();
  return <AccountShell wide><p className={styles.eyebrow}>HANDA BUSINESS WIKI</p><h1>위키 글 수정</h1><ContentEditor key={slug} mode="wiki" uploadsEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} entry={row as ManagedContent}/></AccountShell>;
}
