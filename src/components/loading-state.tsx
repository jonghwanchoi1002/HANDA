import styles from "./loading-state.module.css";

export function LoadingIndicator({ message = "불러오는 중…" }: { message?: string }) {
  return <span className={styles.inline} role="status"><span className={styles.spinner} aria-hidden="true"/><span>{message}</span></span>;
}

export default function PageLoading() {
  return <main className={styles.page} aria-label="콘텐츠 로딩">
    <div className={styles.content} role="status">
      <span className={styles.brand} aria-hidden="true">HANDA</span>
      <div className={styles.symbol} aria-hidden="true"><span className={styles.spinner}/></div>
      <h1>콘텐츠를 불러오고 있어요.</h1>
      <p>잠시만 기다려 주세요.</p>
    </div>
  </main>;
}
