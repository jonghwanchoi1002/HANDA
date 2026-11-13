import { Suspense } from "react";
import HomeTestimonials from "@/components/home-testimonials";
import HomeHeroPhoto from "@/components/home-hero-photo";
import { ContentText } from "@/components/rich-text";
import Image from "next/image";
import Link from "next/link";
import { getHomeContent } from "@/lib/home";
import { getPublishedMembers } from "@/lib/members";
import { getPublishedTestimonials } from "@/lib/testimonials";
import { homeMainPhoto } from "@/data/home-artwork";
import styles from "./page.module.css";

export const instant = false;

export default async function Home() {
  const [home, members, testimonials] = await Promise.all([
    getHomeContent(), getPublishedMembers(), getPublishedTestimonials(),
  ]);
  return <div className={styles.page}>
    <a href="#main" className={styles.skip}>본문으로 바로가기</a>
    <main id="main">
      <section className={styles.hero} aria-labelledby="hero-title">
        <Suspense fallback={null}><HomeHeroPhoto home={home}/></Suspense>
        <div className={styles.heroShade} aria-hidden="true"/>
        <div className={`${styles.wrap} ${styles.heroContent}`}>
          <p className={styles.heroEyebrow}>Berlin Founders Community</p>
          <h1 id="hero-title"><ContentText content={home} field="heroTitle" formatted={false} inline/><br/><ContentText content={home} field="heroSubtitle" formatted={false} inline/> <ContentText content={home} field="heroHighlight" formatted={false} inline/></h1>
          <p className={styles.heroDescription}><ContentText content={home} field="heroDescription" formatted={false} inline/></p>
          <div className={styles.heroActions}><a className={styles.button} href="#about">HANDA 알아보기</a><Link className={styles.button} href="/wiki">비즈니스 위키</Link></div>
        </div>
      </section>
      <section id="about" className={`${styles.section} ${styles.about}`} aria-labelledby="about-title">
        <div className={styles.wrap}>
          <p className={styles.label}>01 — About</p>
          <h2 id="about-title"><ContentText content={home} field="aboutTitle" formatted={false} inline/></h2>
          {home.aboutLead.length>0&&<p className={styles.aboutLead}><ContentText content={home} field="aboutLead" formatted={false} inline/></p>}
          {home.aboutDescription&&<p className={styles.aboutDescription}><ContentText content={home} field="aboutDescription" formatted={false} inline/></p>}
          <div className={styles.values}>{[
            ["01", home.aboutValue1Title, home.aboutValue1Description],
            ["02", home.aboutValue2Title, home.aboutValue2Description],
            ["03", home.aboutValue3Title, home.aboutValue3Description],
          ].map(([number]) => <div key={number}><span className={styles.valueNumber}>{number}</span><h3><ContentText content={home} field={`aboutValue${Number(number)}Title`} formatted={false} inline/></h3><p><ContentText content={home} field={`aboutValue${Number(number)}Description`} formatted={false} inline/></p></div>)}</div>
        </div>
      </section>
      <section id="members" className={styles.section} aria-labelledby="members-title">
        <div className={styles.wrap}>
          <p className={styles.label}>02 — Our People</p><h2 id="members-title">다른 경험, 같은 도전.</h2>
          {members.length ? <div className={styles.people}>{members.slice(0,3).map(member => <Link className={styles.person} href={`/members/${member.slug}`} key={member.slug}>
            <div className={styles.portrait}>{member.photoUrl ? <Image src={member.photoUrl} alt={`${member.name} 프로필 사진`} fill sizes="(max-width: 700px) 90vw, 340px" unoptimized/> : <span>프로필 사진 준비 중</span>}</div>
            <h3><ContentText content={member} field="name" formatted={false} inline/></h3><p><ContentText content={member} field="field" formatted={false} inline/>{member.isExample && <span className={styles.example}> · 예시 멤버</span>}</p>
          </Link>)}</div> : <p className={styles.empty}>멤버 소개를 준비하고 있습니다.</p>}
          <Link className={styles.peopleLink} href="/members">멤버 소개 전체 보기 →</Link>
        </div>
      </section>
      <div className={`${styles.wrap} ${styles.featureGrid}`}>
        <Link id="wiki" href="/wiki" className={`${styles.featureCard} ${styles.wikiCard}`} aria-labelledby="wiki-title">
          <div className={styles.featureContent}><p className={styles.label}>03 — Business Wiki</p><h2 id="wiki-title">경험이 쌓이면, 길이 됩니다.</h2>
          <p className={styles.cardDescription}>승인된 회원을 위한 창업·운영 노하우 위키.</p><span className={styles.cardLink}>위키 전체 보기 →</span></div>
        </Link>
        <Link id="stories" href="/stories" className={`${styles.featureCard} ${styles.journalCard}`} aria-labelledby="stories-title">
          {homeMainPhoto && <Image className={styles.journalPhoto} src={homeMainPhoto} alt="" fill sizes="(max-width: 700px) 100vw, 540px"/>}
          <div className={styles.journalShade} aria-hidden="true"/>
          <div className={styles.featureContent}><p className={styles.label}>04 — Community Journal</p><h2 id="stories-title">만나서 나눈 이야기, 오래 남을 기록.</h2><span className={styles.cardLink}>정기모임 후기 보기 →</span></div>
        </Link>
      </div>
      <section id="testimonials" className={`${styles.section} ${styles.testimonials}`} aria-labelledby="testimonials-label">
        <div className={styles.wrap}><p id="testimonials-label" className={styles.label}>05 — Voices of HANDA</p>
          <Suspense fallback={<p className={styles.voiceAuthor}>멤버 후기를 불러오고 있습니다.</p>}><HomeTestimonials testimonials={testimonials}/></Suspense>
          <Link className={styles.voiceLink} href="/testimonials">멤버 후기 전체 보기 →</Link>
        </div>
      </section>
    </main>
    <footer className={styles.footer}><div className={`${styles.wrap} ${styles.footerInner}`}><Link href="/" aria-label="HANDA 홈"><Image src="/brand/handa-logo-cream.svg" alt="HANDA · Berlin Founders Community" width={160} height={42}/></Link><span>시작하고, 함께 성장합니다. © 2026 HANDA · Berlin</span></div></footer>
  </div>;
}
