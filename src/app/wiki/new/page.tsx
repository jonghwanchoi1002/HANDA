import { getBlobToken } from "@/lib/content/blob-config";
import { randomUUID } from "node:crypto";
import AccountShell from "@/components/account-shell";
import { canManageMembers } from "@/lib/auth/permissions";
import { requireWikiMember } from "@/lib/auth/session";
import { emptyPayload } from "@/lib/content/editor-fields";
import ContentEditor from "@/app/admin/content/editor";
import styles from "@/app/login/auth.module.css";
export const instant=false;
export const metadata={title:"위키 글 작성 | HANDA",robots:{index:false,follow:false}};
export default async function NewWiki(){
  const user=await requireWikiMember();const key=`wiki-${randomUUID()}`;
  return <AccountShell wide><p className={styles.eyebrow}>HANDA BUSINESS WIKI</p><h1>새 글 작성</h1><p className={styles.intro}>경험과 노하우를 나눠 주세요. 작성을 완료하면 공개 대기로 저장하고, 관리자가 확인 후 공개합니다.</p><ContentEditor canPublish={canManageMembers(user)} mode="wiki" uploadsEnabled={Boolean(getBlobToken())} entry={{kind:"wiki",key,payload:emptyPayload("wiki",key),revision:0,status:"draft",consent:false,order:0}}/></AccountShell>;
}
