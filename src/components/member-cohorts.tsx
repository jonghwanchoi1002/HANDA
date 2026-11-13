import type { MemberCohort } from "@/lib/content/member-cohorts";
import styles from "@/app/members/members.module.css";

export default function MemberCohorts({ cohorts = [] }: { cohorts?: MemberCohort[] }) {
  if (!cohorts.length) return null;
  return <section className={styles.cohortSection} aria-label="참여한 기수"><h2>참여한 기수</h2>
    <ul className={styles.cohorts}>{cohorts.map((cohort, index) => <li key={index}><span className={styles.cohortName}>{cohort.name}</span>{cohort.period && <span className={styles.cohortPeriod}>{cohort.period}</span>}</li>)}</ul>
  </section>;
}
