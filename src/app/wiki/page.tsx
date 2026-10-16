import type { Metadata } from "next";
import { getPublishedWikiArticles } from "@/lib/wiki";
import ArticleList from "./article-list";
import styles from "./wiki.module.css";

// 요청 시 DB 또는 세션을 확인하므로 서버 응답을 기다립니다.
export const instant = false;

export const metadata: Metadata = { title: "비즈니스 위키 | HANDA", description: "창업 준비부터 운영과 성장까지, 함께 쌓는 HANDA의 비즈니스 노하우." };

export default async function WikiPage() {
  const wikiArticles = await getPublishedWikiArticles();
  return <main id="wiki-main" className={styles.main}>
    <section className={styles.hero}><p className={styles.eyebrow}>HANDA BUSINESS WIKI</p><h1>경험을 나누고,<br /><span>다음 시작을 돕습니다.</span></h1><p>창업 준비부터 운영과 성장까지.<br />함께 쌓아갈 지식을 한곳에 모았습니다.</p></section>
    {wikiArticles.some((article) => article.isExample) && <aside className={styles.notice}>예시로 표시된 글은 화면 확인을 위한 콘텐츠입니다.</aside>}
    <ArticleList articles={wikiArticles.map(({ slug, category, title, summary, isExample }) => ({ slug, category, title, summary, isExample }))} />
  </main>;
}
