"use client";
import type { MemberCohort } from "@/lib/content/member-cohorts";
import common from "@/app/login/auth.module.css";
import styles from "./content.module.css";

export default function MemberCohortsEditor({ values, onChange }: { values: MemberCohort[]; onChange: (values: MemberCohort[]) => void }) {
  function update(index: number, key: keyof MemberCohort, value: string) {
    onChange(values.map((item, i) => i === index ? { ...item, [key]: value } : item));
  }
  return <div className={styles.group}>
    <h3 className={styles.groupTitle}>참여한 기수 (선택)</h3>
    <p className={styles.help}>기수마다 항목을 추가해 이름과 기간을 입력하세요. 기간은 생략할 수 있고, 모두 비우면 프로필에 표시하지 않습니다.</p>
    {values.map((item, index) => <div key={index} className={styles.cohortRow}>
      <label className={styles.field}>기수 {index + 1} 이름<input name="cohortNames" maxLength={80} placeholder="예: 파일럿, 1기, 2기" value={item.name} required={Boolean(item.period.trim())} onChange={event => update(index, "name", event.target.value)}/></label>
      <label className={styles.field}>기수 {index + 1} 기간 (선택)<input name="cohortPeriods" maxLength={100} placeholder="예: 2025.12 – 2026.5" value={item.period} onChange={event => update(index, "period", event.target.value)}/></label>
      <button type="button" className={common.button} aria-label={`기수 ${index + 1} 삭제`} onClick={() => onChange(values.length === 1 ? [{ name: "", period: "" }] : values.filter((_, i) => i !== index))}>삭제</button>
    </div>)}
    <div className={styles.controls}><button type="button" className={common.button} onClick={() => onChange([...values, { name: "", period: "" }])}>기수 추가</button></div>
  </div>;
}
