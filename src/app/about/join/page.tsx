import type { Metadata } from "next";
import JoinAction from "./join-action";
import styles from "../about.module.css";
export const metadata:Metadata={title:"참여 신청하기 | HANDA"};
export default function JoinPage(){
  return <><p className={styles.eyebrow}>JOIN HANDA</p>
    <section className={styles.invitation} aria-labelledby="join-title"><h1 id="join-title">HANDA에 참여하고 싶으신가요?</h1><p className={styles.lead}>HANDA는 각자의 사업을 실행하며 얻은 경험과 고민을 나누고, 서로의 성장을 돕는 창업자 커뮤니티입니다.</p><JoinAction kind="apply"/></section>
    <section className={`${styles.panel} ${styles.sage}`} aria-labelledby="next-cohort-title"><h2 id="next-cohort-title">아직 참여를 고민 중이신가요?</h2><p>다음 기수 모집이 시작되면 안내받을 수 있어요.</p><JoinAction kind="notify"/></section>
  </>;
}
