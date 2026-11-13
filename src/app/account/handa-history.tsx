import common from "@/app/login/auth.module.css";
import styles from "./profile.module.css";
export default function HandaHistory({joinedAt}:{joinedAt:Date}){
  const date=new Intl.DateTimeFormat("ko-KR",{timeZone:"Europe/Berlin",year:"numeric",month:"long",day:"numeric"}).format(joinedAt);
  return <section className={common.box} aria-labelledby="handa-history-title"><h2 id="handa-history-title">내 HANDA 히스토리</h2>
    <dl className={styles.history}><div><dt>홈페이지 가입일</dt><dd><time dateTime={joinedAt.toISOString()}>{date}</time></dd></div><div><dt>참여한 기수</dt><dd className={styles.placeholder}>추후 추가 예정</dd></div><div><dt>참석한 모임</dt><dd className={styles.placeholder}>추후 추가 예정</dd></div></dl>
  </section>;
}
