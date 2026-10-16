import Link from "next/link";
import styles from "../members.module.css";

export default function MemberNotFound() {
  return <main id="members-main" className={styles.main}><div className={styles.empty}><p className={styles.eyebrow}>404 — NOT FOUND</p><h1>멤버를 찾을 수 없습니다.</h1><p>주소를 확인하거나 공개된 다른 프로필을 살펴보세요.</p><Link href="/members" className={styles.back}>멤버 목록으로 돌아가기 →</Link></div></main>;
}
