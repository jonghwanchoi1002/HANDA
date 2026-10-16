import SiteHeader from "@/components/site-header";
import Link from "next/link";
import { getHomeContent } from "@/lib/home";
import styles from "./page.module.css";




// 요청 시 DB 또는 세션을 확인하므로 서버 응답을 기다립니다.
export const instant = false;

export default async function Home() {
  const home = await getHomeContent();
  return (
    <div className={styles.page}>
      <a href="#main" className={styles.skip}>본문으로 바로가기</a>
      <div className={styles.cover}>
        <SiteHeader />
        <main id="main">
          <section className={styles.hero} aria-labelledby="hero-title">
            <p className={styles.eyebrow}>EVERY BEGINNING NEEDS A COMMUNITY</p>
            <h1 id="hero-title">{home.heroTitle}<br />{home.heroSubtitle} <span>{home.heroHighlight}</span></h1>
            <p className={styles.heroDescription}>{home.heroDescription.map((line, index) => <span key={index}>{index > 0 && <br />}{line}</span>)}</p>
            <a className={styles.button} href="#about">우리의 이야기 <span aria-hidden="true">↗</span></a>
            <div className={styles.heroBottom}><span>서로의 경험이, 다음 시작의 힘이 되도록.</span><a href="#about" aria-label="HANDA 소개로 이동">SCROLL TO EXPLORE ↓</a></div>
          </section>
          <section id="about" className={styles.section} aria-labelledby="about-title">
            <p className={styles.label}>01 — ABOUT US</p>
            <div className={styles.aboutGrid}><h2 id="about-title">{home.aboutTitle.map((line, index) => <span key={index}>{index > 0 && <br />}{line}</span>)}</h2><div><p className={styles.lead}>{home.aboutLead.map((line, index) => <span key={index}>{index > 0 && <br />}{line}</span>)}</p><p>{home.aboutDescription}</p><Link className={styles.textLink} href="/wiki">함께 나눌 노하우 살펴보기 ↗</Link></div></div>
            <div className={styles.values}>{[["CONNECT", "사람과 연결되고"], ["SHARE", "경험을 나누고"], ["GROW", "함께 성장합니다"]].map(([en, ko]) => <div key={en}><span>{en}</span><h3>{ko}</h3></div>)}</div>
          </section>
          <section id="members" className={`${styles.section} ${styles.soft}`} aria-labelledby="members-title">
            <p className={styles.label}>02 — OUR PEOPLE</p><h2 id="members-title">다른 경험, 같은 도전.</h2><p className={styles.intro}>서로의 가능성을 넓혀줄 HANDA의 멤버들을 소개할 공간입니다.</p>
            <div className={styles.memberPlaceholder}><span className={styles.symbol} aria-hidden="true">✳</span><div><h3>곧, 우리의 이야기를 만나보세요.</h3><p>멤버의 사진과 사업 분야, 소개를 준비하고 있습니다.</p></div><Link className={styles.textLink} href="/members">멤버 만나보기 ↗</Link></div>
          </section>
          <section id="wiki" className={styles.section} aria-labelledby="wiki-title">
            <div className={styles.sectionHeading}><div><p className={styles.label}>03 — BUSINESS WIKI</p><h2 id="wiki-title">경험이 쌓이면, 길이 됩니다.</h2></div><Link className={styles.textLink} href="/wiki">위키 전체 보기 ↗</Link></div>
            <p className={styles.intro}>함께 채워갈 비즈니스 위키. 창업과 운영에 관한 이야기를 살펴보세요.</p>
            <div className={styles.memberPlaceholder}><span className={styles.symbol} aria-hidden="true">↗</span><div><h3>승인된 회원을 위한 비즈니스 위키</h3><p>회원들이 나누는 창업과 운영 노하우는 로그인 후 관리자 승인을 받으면 열람할 수 있습니다.</p><Link className={styles.textLink} href="/wiki" prefetch={false}>회원 전용 위키로 이동 ↗</Link></div></div>
          </section>
          <section id="stories" className={`${styles.section} ${styles.dark}`} aria-labelledby="stories-title">
            <p className={styles.label}>04 — COMMUNITY JOURNAL</p><h2 id="stories-title">만나서 나눈 이야기,<br />오래 남을 기록.</h2><p className={styles.intro}>모임에서 오간 질문과 발견, 함께한 순간을 이곳에 기록합니다.</p><div className={styles.emptyStory}><span aria-hidden="true">↗</span><div><h3>우리의 이야기를 차곡차곡.</h3><p>예시 후기로 앞으로 담아갈 모임 기록을 살펴보세요.</p><Link className={styles.textLink} href="/stories">모임 후기 살펴보기 ↗</Link></div></div>
          </section>
          <section id="testimonials" className={styles.section} aria-labelledby="testimonials-title">
            <p className={styles.label}>05 — VOICES OF HANDA</p><h2 id="testimonials-title">함께한 사람들의 목소리.</h2><div className={styles.voices}><span aria-hidden="true">“</span><div><p>HANDA에서 만난 인연과 배움.<br />참가자들의 진솔한 이야기를 담을 예정입니다.</p><small>실제 참가자 후기를 준비하고 있습니다.</small><br /><Link className={styles.textLink} href="/testimonials">참가자 이야기 살펴보기 ↗</Link></div></div>
          </section>
        </main>
      </div>
      <footer className={styles.footer}><div><Link href="/" className={styles.footerLogo}>HANDA.</Link><p>시작하고, 함께 성장합니다.</p></div><span>© 2026 HANDA · Berlin</span><a href="#main">맨 위로 ↑</a></footer>
    </div>
  );
}
