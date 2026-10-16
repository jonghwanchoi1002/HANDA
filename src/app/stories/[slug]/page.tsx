import { storyRecords } from "@/data/stories";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedStory, formatEventDate } from "@/lib/stories";
import StoryPhoto from "@/components/story-photo";
import styles from "../stories.module.css";

type Props = { params: Promise<{ slug: string }> };
export async function generateStaticParams() {
  return storyRecords.filter((story) => story.status === "published").map((story) => ({ slug: story.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const story = await getPublishedStory((await params).slug);
  return { title: story ? `${story.title} | HANDA 모임 후기` : "후기를 찾을 수 없습니다 | HANDA", description: story?.summary };
}
export default async function StoryPage({ params }: Props) {
  const story = await getPublishedStory((await params).slug);
  if (!story) notFound();
  return <main id="stories-main" className={`${styles.main} ${styles.articleMain}`}>
    <Link href="/stories" className={styles.back}>← 모임 후기 목록</Link>
    <article><header className={styles.articleHeader}><p className={styles.eyebrow}>COMMUNITY JOURNAL {story.isExample && "· 예시 후기"}</p><h1>{story.title}</h1><p>{story.summary}</p><div className={styles.meta}><time dateTime={story.eventDate}>{formatEventDate(story.eventDate)}</time><span>{story.location}</span></div></header>
      {story.isExample && <aside className={styles.notice}>실제 행사가 아닌 예시 후기입니다. 날짜와 장소도 화면 개발을 위한 가상의 정보입니다.</aside>}
      {story.cover && <StoryPhoto image={story.cover} />}
      <div className={styles.body}>{story.blocks.map((block) => {
        switch (block.type) {
          case "heading": return <h2 key={block.id}>{block.text}</h2>;
          case "paragraph": return <p key={block.id}>{block.text}</p>;
          case "image": return <StoryPhoto key={block.id} image={block.image} />;
        }
      })}</div>
    </article><div className={styles.end}><Link href="/stories" className={styles.back}>다른 모임 후기 살펴보기 →</Link></div>
  </main>;
}
