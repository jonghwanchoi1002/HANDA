import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublishedMembers, getPublishedMember } from "@/lib/members";
import styles from "../members.module.css";

type Props = { params: Promise<{ slug: string }> };
export async function generateStaticParams() {
  return (await getPublishedMembers()).map((member) => ({ slug: member.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const member = await getPublishedMember((await params).slug);
  return { title: member ? `${member.name} | HANDA 멤버` : "멤버를 찾을 수 없습니다 | HANDA", description: member?.summary };
}
export default async function MemberPage({ params }: Props) {
  const member = await getPublishedMember((await params).slug);
  if (!member) notFound();
  const website = member.website && /^https?:\/\//i.test(member.website) ? member.website : null;
  return <main id="members-main" className={styles.main}>
    <Link href="/members" className={styles.back}>← 멤버 목록</Link>
    {member.isExample && <aside className={styles.notice}>실제 인물이 아닌 화면 개발용 예시 프로필입니다.</aside>}
    <article className={styles.profile}>
      <div><div className={styles.profilePortrait}>{member.photoUrl ? <Image src={member.photoUrl} alt={`${member.name} 프로필 사진`} width={600} height={600} unoptimized /> : <><span aria-hidden="true">✳</span><small>프로필 사진 준비 중</small></>}</div></div>
      <div><p className={styles.eyebrow}>{member.field}</p><h1>{member.name}</h1><p className={styles.profileRole}>{member.role}</p><p className={styles.lead}>{member.summary}</p>
        <section className={styles.bio}><h2>소개</h2>{member.introduction.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>
        <section className={styles.bio}><h2>함께 이야기하고 싶은 주제</h2><ul className={styles.tags}>{member.interests.map((interest) => <li key={interest}>{interest}</li>)}</ul></section>
        <section className={styles.bio}><h2>더 알아보기</h2>{website ? <a className={styles.back} href={website} target="_blank" rel="noopener noreferrer">웹사이트 방문 ↗</a> : <p>아직 등록된 웹사이트가 없습니다.</p>}</section>
      </div>
    </article><div className={styles.end}><Link href="/members" className={styles.back}>다른 멤버 만나보기 →</Link></div>
  </main>;
}
