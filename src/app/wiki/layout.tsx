import SiteHeader from "@/components/site-header";
import { requireWikiMember } from "@/lib/auth/session";
import Link from "next/link";
import styles from "./wiki.module.css";

export default async function WikiLayout({ children }: { children: React.ReactNode }) {
  await requireWikiMember();
  return <div className={styles.shell}>
    <a href="#wiki-main" className={styles.skip}>본문으로 바로가기</a>
    <SiteHeader active="/wiki" />
    {children}
    <footer className={styles.footer}><Link href="/">HANDA.</Link><span>시작하고, 함께 성장합니다.</span><span>© 2026 HANDA</span></footer>
  </div>;
}
