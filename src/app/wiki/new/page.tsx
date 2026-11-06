import { randomUUID } from "node:crypto";
import AccountShell from "@/components/account-shell";
import { requireWikiMember } from "@/lib/auth/session";
import { emptyPayload } from "@/lib/content/editor-fields";
import ContentEditor from "@/app/admin/content/editor";
import styles from "@/app/login/auth.module.css";
export const instant=false;
export const metadata={title:"위키 글 작성 | HANDA",robots:{index:false,follow:false}};
export default async function NewWiki(){
  await requireWikiMember();const key=`wiki-${randomUUID()}`;
  return <AccountShell wide><p className={styles.eyebrow}>HANDA BUSINESS WIKI</p><h1>새 글 작성</h1><p className={styles.intro}>경험과 노하우를 나눠 주세요. 공개한 글은 승인된 회원만 읽을 수 있습니다.</p><ContentEditor mode="wiki" uploadsEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} entry={{kind:"wiki",key,payload:emptyPayload("wiki",key),revision:0,status:"draft",consent:false,order:0}}/></AccountShell>;
}
