"use client";

import common from "@/app/login/auth.module.css";
import styles from "./content.module.css";

export default function MemberWebsites({ values, onChange }: { values: string[]; onChange: (values: string[]) => void }) {
  return <div className={styles.group}>
    <p className={styles.help}>웹사이트는 모두 선택 사항입니다. example.com처럼 입력해도 저장되며, 빈 항목은 저장하지 않습니다.</p>
    {values.map((value, index) => <div key={index} className={styles.websiteRow}>
      <label className={styles.field}>웹사이트 {index + 1} (선택)
        <input name="websites" type="text" inputMode="url" autoCapitalize="none" spellCheck={false} placeholder="https://example.com" maxLength={2000} value={value} onChange={event => onChange(values.map((item, i) => i === index ? event.target.value : item))}/>
      </label>
      <button type="button" className={common.button} aria-label={`웹사이트 ${index + 1} 삭제`} onClick={() => onChange(values.length === 1 ? [""] : values.filter((_, i) => i !== index))}>삭제</button>
    </div>)}
    <div className={styles.controls}><button type="button" className={common.button} onClick={() => onChange([...values, ""])}>웹사이트 추가</button></div>
  </div>;
}
