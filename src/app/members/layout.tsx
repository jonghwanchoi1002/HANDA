import SiteHeader from "@/components/site-header";
import Link from "next/link";
import styles from "./members.module.css";

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.shell}>
    <a className={styles.skip} href="#members-main">본문으로 바로가기</a>
    <SiteHeader active="/members" />
    {children}
    <footer className={styles.footer}><Link href="/">HANDA.</Link><span>시작하고, 함께 성장합니다.</span><span>© 2026 HANDA</span></footer>
  </div>;
}
