import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import AccountShell from "@/components/account-shell";
import { requireAdmin } from "@/lib/auth/session";
import { kindSchema, labels } from "@/lib/content/management";
import { emptyPayload } from "@/lib/content/editor-fields";
import ContentEditor from "../../editor";
import styles from "@/app/login/auth.module.css";
export const instant=false;
export const metadata={title:"새 글 작성 | HANDA",robots:{index:false,follow:false}};
export default async function NewContent({params}:{params:Promise<{kind:string}>}) {
  await requireAdmin();
  const kind=kindSchema.safeParse((await params).kind).data;if(!kind||kind==="home")notFound();
  const key=`${kind}-${randomUUID()}`;
  return <AccountShell wide><p className={styles.eyebrow}>HANDA ADMIN</p><h1>{labels[kind]} 작성</h1><p className={styles.intro}>임시 저장한 글은 방문자에게 보이지 않습니다. 공개 상태로 저장하면 해당 페이지에 표시됩니다.</p><ContentEditor entry={{kind,key,payload:emptyPayload(kind,key),revision:0,status:"draft",consent:false,order:0}}/></AccountShell>;
}
