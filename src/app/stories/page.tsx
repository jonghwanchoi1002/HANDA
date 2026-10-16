import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublishedStories, formatEventDate } from "@/lib/stories";
import styles from "./stories.module.css";

// 요청 시 DB 또는 세션을 확인하므로 서버 응답을 기다립니다.
export const instant = false;

export const metadata: Metadata = { title: "모임 후기 | HANDA", description: "함께한 순간과 배움을 기록하는 HANDA의 모임 후기." };

export default async function StoriesPage() {
  const stories = await getPublishedStories();
  return <main id="stories-main" className={styles.main}>
    <section className={styles.hero}><p className={styles.eyebrow}>HANDA COMMUNITY JOURNAL</p><h1>함께한 순간,<br /><span>오래 남을 이야기.</span></h1><p>만나서 나눈 질문과 배움.<br />우리의 다음 시작이 될 순간들을 기록합니다.</p></section>
    {stories.some((story) => story.isExample) && <aside className={styles.notice}>현재 글은 화면 확인을 위한 예시입니다. 날짜·장소는 가상의 정보이며 실제 행사 후기가 아닙니다.</aside>}
    <p className={styles.count}>총 {stories.length}개의 후기</p>
    {stories.length ? <div className={styles.grid}>{stories.map((story) => <Link className={styles.card} key={story.slug} href={`/stories/${story.slug}`}>
      <div className={styles.cover}>{story.cover ? <Image src={story.cover.url} alt={story.cover.alt} width={story.cover.width} height={story.cover.height} unoptimized /> : <><span aria-hidden="true">↗</span><small>모임 사진 준비 중</small></>}</div>
      <div className={styles.cardBody}><div className={styles.meta}><time dateTime={story.eventDate}>{formatEventDate(story.eventDate)}</time>{story.isExample && <span>예시 후기</span>}</div><h2>{story.title}</h2><p>{story.summary}</p><span className={styles.location}>{story.location}</span><span className={styles.read}>후기 읽기 <span aria-hidden="true">↗</span></span></div>
    </Link>)}</div> : <div className={styles.empty}><h2>첫 번째 모임 후기를 기다립니다.</h2><p>공개된 후기가 등록되면 이곳에서 만나보실 수 있습니다.</p></div>}
  </main>;
}
