import Image from "next/image";
import Link from "next/link";
import styles from "./about.module.css";

export default function AboutLayout({children}:{children:React.ReactNode}){
  return <div className={styles.shell}>
    <a href="#about-main" className={styles.skip}>본문으로 바로가기</a>
    <main id="about-main" className={styles.main}>{children}</main>
    <footer className={styles.footer}><div><Link href="/#top" aria-label="HANDA 홈"><Image src="/brand/handa-logo-cream.svg" alt="HANDA · Berlin Founders Community" width={160} height={42}/></Link><span>시작하고, 함께 성장합니다. © 2026 HANDA · Berlin</span></div></footer>
  </div>;
}
