
import { ContentText } from "@/components/rich-text";
import { memberRecords } from "@/data/members";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublishedMember } from "@/lib/members";
import styles from "../members.module.css";
import { getMemberWebsiteLinks } from "@/lib/content/member-websites";
import MemberWebsiteLinks from "@/components/member-website-links";
import ContentTags from "@/components/content-tags";

type Props = { params: Promise<{ slug: string }> };
// 요청 시 DB 또는 세션을 확인하므로 서버 응답을 기다립니다.
export const instant = false;

export async function generateStaticParams() {
  return memberRecords.filter((member) => member.status === "published").map((member) => ({ slug: member.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const member = await getPublishedMember((await params).slug);
  return { title: member ? `${member.name} | HANDA 멤버` : "멤버를 찾을 수 없습니다 | HANDA", description: member?.summary };
}
export default async function MemberPage({ params }: Props) {
  const member = await getPublishedMember((await params).slug);
  if (!member) notFound();
  const websites = getMemberWebsiteLinks(member).filter(link=>/^https?:\/\//i.test(link.url));
  return <main id="members-main" className={styles.main}>
    <Link href="/members" className={styles.back}>← 멤버 목록</Link>
    {member.isExample && <aside className={styles.notice}>실제 인물이 아닌 화면 개발용 예시 프로필입니다.</aside>}
    <article className={styles.profile}>
      <div><div className={styles.profilePortrait}>{member.photoUrl ? <Image src={member.photoUrl} alt={`${member.name} 프로필 사진`} width={600} height={600} unoptimized /> : <><span aria-hidden="true">↗</span><small>프로필 사진 준비 중</small></>}</div></div>
      <div><p className={styles.eyebrow}><ContentText content={member} field="field" inline/></p><h1><ContentText content={member} field="name" inline/></h1><p className={styles.profileRole}><ContentText content={member} field="role" inline/></p><p className={styles.lead}><ContentText content={member} field="summary" inline/></p>
        <section className={styles.bio}><h2>소개</h2><ContentText content={member} field="introduction"/></section>
        <section className={styles.bio}><h2>함께 이야기하고 싶은 주제</h2><ContentTags items={member.interests.map(text=>({text}))}/></section>
        <section className={styles.bio}><h2>더 알아보기</h2><MemberWebsiteLinks links={websites}/></section>
      </div>
    </article><div className={styles.end}><Link href="/members" className={styles.back}>다른 멤버 만나보기 →</Link></div>
  </main>;
}
