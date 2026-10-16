import AdminNav from "./admin-nav";
import Link from "next/link";
import headerStyles from "@/app/page.module.css";
import styles from "@/app/login/auth.module.css";
export default function AccountShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={styles.shell}><header className={headerStyles.header}><Link href="/" className={headerStyles.logo} aria-label="HANDA 홈">HANDA<span>.</span><small>BERLIN FOUNDERS COMMUNITY</small></Link><nav className={headerStyles.nav} aria-label="계정 메뉴"><AdminNav /><Link href="/">홈으로 ↗</Link></nav></header><main className={`${styles.main} ${wide ? styles.wide : ""}`}>{children}</main></div>;
}
