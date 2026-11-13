"use client";

import common from "@/app/login/auth.module.css";
import styles from "./content.module.css";
import type { MemberWebsiteLink } from "@/lib/content/member-websites";

export default function MemberWebsites({ values, onChange }: { values: MemberWebsiteLink[]; onChange: (values: MemberWebsiteLink[]) => void }) {
  return <div className={styles.memberFields}>
    <p className={styles.help}>이름과 주소는 모두 선택 사항입니다. 이름을 비우면 주소가 표시되며, 주소가 없는 항목은 저장하지 않습니다. example.com처럼 입력해도 저장됩니다.</p>
    {values.map((value, index) => <div key={index} className={styles.websiteRow}>
      <div className={styles.websiteFields}>
        <label className={styles.field}>웹사이트 {index + 1} 이름 (선택)
          <input name="websiteNames" type="text" placeholder="예: 회사 홈페이지, LinkedIn" maxLength={200} value={value.name} onChange={event => onChange(values.map((item, i) => i === index ? { ...item, name: event.target.value } : item))}/>
        </label>
        <label className={styles.field}>웹사이트 {index + 1} 주소 (선택)
          <input name="websites" type="text" inputMode="url" autoCapitalize="none" spellCheck={false} placeholder="https://example.com" maxLength={2000} value={value.url} onChange={event => onChange(values.map((item, i) => i === index ? { ...item, url: event.target.value } : item))}/>
        </label>
      </div>
      <button type="button" className={common.button} aria-label={`웹사이트 ${index + 1} 삭제`} onClick={() => onChange(values.length === 1 ? [{ name: "", url: "" }] : values.filter((_, i) => i !== index))}>삭제</button>
    </div>)}
    <div className={styles.controls}><button type="button" className={common.button} onClick={() => onChange([...values, { name: "", url: "" }])}>웹사이트 추가</button></div>
  </div>;
}
