import Link from "next/link";
import styles from "../stories.module.css";

export default function StoryNotFound() {
  return <main id="stories-main" className={styles.main}><div className={styles.empty}><p className={styles.eyebrow}>404 — NOT FOUND</p><h1>후기를 찾을 수 없습니다.</h1><p>주소를 확인하거나 다른 모임 후기를 살펴보세요.</p><Link className={styles.back} href="/stories">모임 후기 목록으로 돌아가기 →</Link></div></main>;
}
