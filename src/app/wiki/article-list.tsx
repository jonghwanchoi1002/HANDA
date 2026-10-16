"use client";

import { useState } from "react";
import Link from "next/link";
import type { WikiArticle } from "@/data/wiki";
import styles from "./wiki.module.css";

type ArticlePreview = Pick<WikiArticle, "slug" | "category" | "title" | "summary">;

export default function ArticleList({ articles }: { articles: ArticlePreview[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const categories = ["전체", ...new Set(articles.map((article) => article.category))];
  const search = query.trim().toLocaleLowerCase();
  const filtered = articles.filter((article) => (category === "전체" || article.category === category) && `${article.title} ${article.summary} ${article.category}`.toLocaleLowerCase().includes(search));

  return <section aria-label="위키 글 목록">
    <div className={styles.toolbar}><div className={styles.categories} role="group" aria-label="카테고리 선택">{categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div><div className={styles.search}><label htmlFor="wiki-search">글 검색</label><input id="wiki-search" type="search" placeholder="제목이나 키워드를 입력하세요" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div>
    <p className={styles.count} role="status">총 {filtered.length}개의 예시 글</p>
    {filtered.length ? <div className={styles.grid}>{filtered.map((article) => <Link key={article.slug} className={styles.card} href={`/wiki/${article.slug}`}><div className={styles.cardTop}><span>{article.category}</span><span>예시 콘텐츠</span></div><h2>{article.title}</h2><p>{article.summary}</p><span className={styles.read}>읽어보기 <span aria-hidden="true">↗</span></span></Link>)}</div> : <div className={styles.empty}><h2>검색 결과가 없습니다.</h2><p>다른 키워드를 입력하거나 카테고리를 바꿔보세요.</p><button type="button" onClick={() => { setQuery(""); setCategory("전체"); }}>검색 조건 초기화</button></div>}
  </section>;
}
