import type { Metadata } from "next";
import { wikiArticles } from "@/data/wiki";
import ArticleList from "./article-list";
import styles from "./wiki.module.css";

export const metadata: Metadata = { title: "비즈니스 위키 | HANDA", description: "창업 준비부터 운영과 성장까지, 함께 쌓는 HANDA의 비즈니스 노하우." };

export default function WikiPage() {
  return <main id="wiki-main" className={styles.main}>
    <section className={styles.hero}><p className={styles.eyebrow}>HANDA BUSINESS WIKI</p><h1>경험을 나누고,<br /><span>다음 시작을 돕습니다.</span></h1><p>창업 준비부터 운영과 성장까지.<br />함께 쌓아갈 지식을 한곳에 모았습니다.</p></section>
    <aside className={styles.notice}>현재는 화면 확인을 위한 예시 글입니다. 커뮤니티의 실제 노하우는 앞으로 추가할 예정입니다.</aside>
    <ArticleList articles={wikiArticles.map(({ slug, category, title, summary }) => ({ slug, category, title, summary }))} />
  </main>;
}
