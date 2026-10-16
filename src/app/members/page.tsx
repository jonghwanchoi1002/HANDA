import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublishedMembers } from "@/lib/members";
import styles from "./members.module.css";

export const metadata: Metadata = { title: "멤버 소개 | HANDA", description: "다른 경험, 같은 도전. HANDA의 멤버들을 만나보세요." };

export default async function MembersPage() {
  const members = await getPublishedMembers();
  return <main id="members-main" className={styles.main}>
    <section className={styles.hero}><p className={styles.eyebrow}>THE PEOPLE OF HANDA</p><h1>다른 경험,<br /><span>같은 도전.</span></h1><p>서로의 경험이 새로운 가능성이 되도록.<br />함께 배우고 성장할 동료들을 만나는 공간입니다.</p></section>
    {members.some((member) => member.isExample) && <aside className={styles.notice}>현재 프로필은 화면 확인을 위한 가상의 예시입니다. 실제 멤버의 정보와 사진은 추후 추가합니다.</aside>}
    <p className={styles.count}>총 {members.length}개의 프로필</p>
    {members.length ? <div className={styles.grid}>{members.map((member, index) => <Link className={styles.card} key={member.slug} href={`/members/${member.slug}`}>
      <div className={styles.portrait} style={{ "--portrait-tone": ["#dce4d0", "#e6dccc", "#d3e1dc"][index % 3] } as React.CSSProperties}>{member.photoUrl ? <Image src={member.photoUrl} alt={`${member.name} 프로필 사진`} width={600} height={450} unoptimized /> : <><span aria-hidden="true">✳</span><small>프로필 사진 준비 중</small></>}</div>
      <div className={styles.cardBody}><div className={styles.meta}><span>{member.field}</span>{member.isExample && <span>예시 프로필</span>}</div><h2>{member.name}</h2><p className={styles.role}>{member.role}</p><p className={styles.summary}>{member.summary}</p><span className={styles.read}>프로필 보기 <span aria-hidden="true">↗</span></span></div>
    </Link>)}</div> : <div className={styles.empty}><h2>멤버 소개를 준비하고 있습니다.</h2><p>공개된 프로필이 등록되면 이곳에서 만나보실 수 있습니다.</p></div>}
  </main>;
}
