import styles from "@/app/login/auth.module.css";
export default function AccountShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={styles.shell}><main className={`${styles.main} ${wide ? styles.wide : ""}`}>{children}</main></div>;
}
