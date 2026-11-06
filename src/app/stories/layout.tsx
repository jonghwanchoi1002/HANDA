import Image from "next/image";
import Link from "next/link";
import styles from "./stories.module.css";

export default function StoriesLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.shell}>
    <a href="#stories-main" className={styles.skip}>본문으로 바로가기</a>

    {children}
    <footer className={styles.footer}><Link href="/" aria-label="HANDA 홈"><Image src="/brand/handa-logo-cream.svg" alt="HANDA · Berlin Founders Community" width={160} height={42}/></Link><span>시작하고, 함께 성장합니다.</span><span>© 2026 HANDA</span></footer>
  </div>;
}
