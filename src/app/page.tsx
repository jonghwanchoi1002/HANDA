import Link from "next/link";
import { wikiArticles } from "@/data/wiki";
import styles from "./page.module.css";

const menus = [
  ["about", "HANDA 소개"], ["members", "멤버"], ["wiki", "비즈니스 위키"],
  ["stories", "모임 후기"], ["testimonials", "참가자 이야기"],
];


export default function Home() {
  return (
    <div className={styles.page}>
      <a href="#main" className={styles.skip}>본문으로 바로가기</a>
      <div className={styles.cover}>
        <header className={styles.header}>
          <Link className={styles.logo} href="/" aria-label="HANDA 홈">HANDA<span>.</span><small>BERLIN FOUNDERS COMMUNITY</small></Link>
          <nav aria-label="주 메뉴" className={styles.nav}>
            {menus.map(([id, label]) => <Link key={id} href={id === "wiki" ? "/wiki" : `#${id}`}>{label}</Link>)}
          </nav>
        </header>
        <main id="main">
          <section className={styles.hero} aria-labelledby="hero-title">
            <p className={styles.eyebrow}>EVERY BEGINNING NEEDS A COMMUNITY</p>
            <h1 id="hero-title">시작하고,<br />함께 <span>성장합니다.</span></h1>
            <p className={styles.heroDescription}>창업의 고민과 경험을 나누는<br />베를린 창업자 커뮤니티, HANDA.</p>
            <a className={styles.button} href="#about">우리의 이야기 <span aria-hidden="true">↗</span></a>
            <div className={styles.heroBottom}><span>서로의 경험이, 다음 시작의 힘이 되도록.</span><a href="#about" aria-label="HANDA 소개로 이동">SCROLL TO EXPLORE ↓</a></div>
          </section>
          <section id="about" className={styles.section} aria-labelledby="about-title">
            <p className={styles.label}>01 — ABOUT US</p>
            <div className={styles.aboutGrid}><h2 id="about-title">혼자 고민하던 일을,<br />함께 풀어가는 곳.</h2><div><p className={styles.lead}>낯선 환경에서 시작하는 창업.<br />경험을 나눌 동료가 있다면 달라집니다.</p><p>HANDA는 베를린에서 창업에 관심 있는 사람들이 연결되는 커뮤니티입니다. 각자의 도전과 배움을 나누며, 다음 한 걸음을 함께 고민합니다.</p><Link className={styles.textLink} href="/wiki">함께 나눌 노하우 살펴보기 ↗</Link></div></div>
            <div className={styles.values}>{[["CONNECT", "사람과 연결되고"], ["SHARE", "경험을 나누고"], ["GROW", "함께 성장합니다"]].map(([en, ko]) => <div key={en}><span>{en}</span><h3>{ko}</h3></div>)}</div>
          </section>
          <section id="members" className={`${styles.section} ${styles.soft}`} aria-labelledby="members-title">
            <p className={styles.label}>02 — OUR PEOPLE</p><h2 id="members-title">다른 경험, 같은 도전.</h2><p className={styles.intro}>서로의 가능성을 넓혀줄 HANDA의 멤버들을 소개할 공간입니다.</p>
            <div className={styles.memberPlaceholder}><span className={styles.symbol} aria-hidden="true">✳</span><div><h3>곧, 우리의 이야기를 만나보세요.</h3><p>멤버의 사진과 사업 분야, 소개를 준비하고 있습니다.</p></div><span className={styles.badge}>소개 준비 중</span></div>
          </section>
          <section id="wiki" className={styles.section} aria-labelledby="wiki-title">
            <div className={styles.sectionHeading}><div><p className={styles.label}>03 — BUSINESS WIKI</p><h2 id="wiki-title">경험이 쌓이면, 길이 됩니다.</h2></div><Link className={styles.textLink} href="/wiki">위키 전체 보기 ↗</Link></div>
            <p className={styles.intro}>함께 채워갈 비즈니스 위키. 지금은 화면 확인을 위한 예시 글을 만나보세요.</p>
            <div className={styles.topics}>{wikiArticles.map((article) => <article key={article.slug}><div className={styles.topicTop}><span>{article.category}</span><span>예시 콘텐츠</span></div><h3><Link href={`/wiki/${article.slug}`}>{article.title}</Link></h3><p>{article.summary}</p><Link className={styles.textLink} href={`/wiki/${article.slug}`}>읽어보기 ↗</Link></article>)}</div>
          </section>
          <section id="stories" className={`${styles.section} ${styles.dark}`} aria-labelledby="stories-title">
            <p className={styles.label}>04 — COMMUNITY JOURNAL</p><h2 id="stories-title">만나서 나눈 이야기,<br />오래 남을 기록.</h2><p className={styles.intro}>모임에서 오간 질문과 발견, 함께한 순간을 이곳에 기록합니다.</p><div className={styles.emptyStory}><span aria-hidden="true">↗</span><div><h3>첫 번째 모임 후기를 기다립니다.</h3><p>모임 사진과 후기를 준비해 이곳에서 전해드릴게요.</p></div></div>
          </section>
          <section id="testimonials" className={styles.section} aria-labelledby="testimonials-title">
            <p className={styles.label}>05 — VOICES OF HANDA</p><h2 id="testimonials-title">함께한 사람들의 목소리.</h2><div className={styles.voices}><span aria-hidden="true">“</span><div><p>HANDA에서 만난 인연과 배움.<br />참가자들의 진솔한 이야기를 담을 예정입니다.</p><small>실제 참가자 후기를 준비하고 있습니다.</small></div></div>
          </section>
        </main>
      </div>
      <footer className={styles.footer}><div><Link href="/" className={styles.footerLogo}>HANDA.</Link><p>시작하고, 함께 성장합니다.</p></div><span>© 2026 HANDA · Berlin</span><a href="#main">맨 위로 ↑</a></footer>
    </div>
  );
}
