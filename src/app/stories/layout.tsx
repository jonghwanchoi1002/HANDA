import AccountNav from "@/components/account-nav";
import Link from "next/link";
import styles from "./stories.module.css";

export default function StoriesLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.shell}>
    <a href="#stories-main" className={styles.skip}>본문으로 바로가기</a>
    <header className={styles.header}><Link href="/" className={styles.logo}>HANDA<span>.</span></Link><nav aria-label="주 메뉴"><Link href="/#about">HANDA 소개</Link><Link href="/members">멤버</Link><Link href="/wiki">비즈니스 위키</Link><Link href="/stories" aria-current="true">모임 후기</Link><Link href="/testimonials">참가자 이야기</Link><Link href="/">홈으로 ↗</Link><AccountNav /></nav></header>
    {children}
    <footer className={styles.footer}><Link href="/">HANDA.</Link><span>시작하고, 함께 성장합니다.</span><span>© 2026 HANDA</span></footer>
  </div>;
}
