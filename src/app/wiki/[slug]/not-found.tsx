import Link from "next/link";
import styles from "../wiki.module.css";

export default function ArticleNotFound() {
  return <main id="wiki-main" className={styles.main}><div className={styles.empty}><p className={styles.eyebrow}>404 — NOT FOUND</p><h1>글을 찾을 수 없습니다.</h1><p>주소를 확인하거나 위키 목록에서 다른 글을 찾아보세요.</p><Link href="/wiki" className={styles.back}>비즈니스 위키로 돌아가기 →</Link></div></main>;
}
