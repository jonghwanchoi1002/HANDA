import AdminNav from "./admin-nav";
import Link from "next/link";
import styles from "@/app/login/auth.module.css";
export default function AccountShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={styles.shell}><header className={styles.header}><Link href="/" className={styles.logo}>HANDA.</Link><nav className={styles.headerNav} aria-label="계정 메뉴"><Link href="/">홈으로 ↗</Link><AdminNav /></nav></header><main className={`${styles.main} ${wide ? styles.wide : ""}`}>{children}</main></div>;
}
