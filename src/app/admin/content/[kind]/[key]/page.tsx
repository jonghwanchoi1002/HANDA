import { notFound } from "next/navigation";
import AccountShell from "@/components/account-shell";
import { requireAdmin } from "@/lib/auth/session";
import { getDatabase } from "@/lib/content/database";
import { kindSchema, labels, type ManagedContent } from "@/lib/content/management";
import ContentEditor from "../../editor";
import styles from "@/app/login/auth.module.css";
export const instant=false;
export const metadata={title:"콘텐츠 수정 | HANDA",robots:{index:false,follow:false}};
export default async function EditContent({params}:{params:Promise<{kind:string;key:string}>}) {
  await requireAdmin();
  const input=await params;const kind=kindSchema.safeParse(input.kind).data;if(!kind)notFound();
  const result=await getDatabase().query("SELECT kind,content_key AS key,payload,status,publication_consent AS consent,sort_order AS \"order\",revision FROM handa_content WHERE kind=$1 AND content_key=$2",[kind,input.key]);
  const entry=result.rows[0] as ManagedContent|undefined;if(!entry)notFound();
  return <AccountShell wide><p className={styles.eyebrow}>HANDA ADMIN</p><h1>{labels[kind]} 수정</h1><ContentEditor key={`${kind}/${entry.key}`} entry={entry}/></AccountShell>;
}
