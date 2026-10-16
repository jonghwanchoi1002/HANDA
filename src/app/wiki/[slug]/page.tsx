import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { wikiArticles } from "@/data/wiki";
import { getPublishedWikiArticle } from "@/lib/wiki";
import styles from "../wiki.module.css";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
  return wikiArticles.map((article) => ({ slug: article.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedWikiArticle(slug);
  return { title: article ? `${article.title} | HANDA 위키` : "글을 찾을 수 없습니다 | HANDA" };
}
export default async function WikiArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getPublishedWikiArticle(slug);
  if (!article) notFound();
  return <main id="wiki-main" className={`${styles.main} ${styles.articleMain}`}>
    <Link href="/wiki" className={styles.back}>← 비즈니스 위키 목록</Link>
    <article><header className={styles.articleHeader}><p className={styles.eyebrow}>{article.category}{article.isExample && " · 예시 콘텐츠"}</p><h1>{article.title}</h1><p>{article.summary}</p></header>
      {article.isExample && <aside className={styles.notice}>화면 개발을 위한 예시 글입니다. 개별 상황에 대한 전문적인 세무·법률 자문을 제공하지 않습니다.</aside>}
      <nav className={styles.contents} aria-label="글 목차"><h2>이 글의 내용</h2><ol>{article.sections.map((section, index) => <li key={section.title}><a href={`#section-${index + 1}`}>{section.title}</a></li>)}</ol></nav>
      <div className={styles.body}>{article.sections.map((section, index) => <section key={section.title} id={`section-${index + 1}`}><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}</div>
    </article>
    <div className={styles.articleEnd}><p>다른 경험도 함께 살펴보세요.</p><Link href="/wiki" className={styles.back}>전체 글로 돌아가기 →</Link></div>
  </main>;
}
