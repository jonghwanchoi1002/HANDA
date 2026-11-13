
import { ContentText } from "@/components/rich-text";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublishedTestimonials } from "@/lib/testimonials";
import styles from "./testimonials.module.css";

// 요청 시 DB 또는 세션을 확인하므로 서버 응답을 기다립니다.
export const instant = false;

export const metadata: Metadata = {
  title: "멤버 후기 | HANDA",
  description: "연결과 배움, 그리고 성장. HANDA와 함께하는 사람들의 목소리를 담는 공간입니다.",
};

export default async function TestimonialsPage() {
  const testimonials = await getPublishedTestimonials();
  return <div className={styles.shell}>
    <a className={styles.skip} href="#testimonials-main">본문으로 바로가기</a>

    <main id="testimonials-main" className={styles.main}>
      <section className={styles.hero}><p className={styles.eyebrow}>VOICES OF HANDA</p><h1>함께한 사람들의<br /><span>목소리를 담습니다.</span></h1><p>연결되는 순간, 서로에게 배우는 시간.<br />HANDA와 함께하는 사람들의 이야기를 모아갑니다.</p></section>
      <section aria-labelledby="voices-title" className={styles.voices}>
        <div className={styles.sectionHeading}><h2 id="voices-title">연결, 배움, 성장의 이야기</h2><p>총 {testimonials.length}개의 이야기</p></div>
        {testimonials.length ? <div className={styles.grid}>{testimonials.map((item) => <article className={styles.card} key={item.id}>
          <div className={styles.cardTop}><span><ContentText content={item} field="topic" inline/></span>{item.isExample && <span>예시 문구</span>}</div>
          <span className={styles.quoteMark} aria-hidden="true">“</span><blockquote><p><ContentText content={item} field="quote" inline/></p></blockquote>
          <div className={styles.author}><div className={styles.avatar}>{item.photo ? <Image src={item.photo.url} alt={item.photo.alt} width={item.photo.width} height={item.photo.height} unoptimized /> : <span aria-hidden="true">{item.name.slice(0, 1)}</span>}</div><div><h3><ContentText content={item} field="name" inline/></h3><p><ContentText content={item} field="introduction" inline/></p></div></div>
          <Link className={styles.cardLink} href={`/testimonials/${item.id}`} aria-label={`${item.name}님의 후기 보기`}>후기 보기 <span aria-hidden="true">↗</span></Link>
        </article>)}</div> : <div className={styles.empty}><h3>첫 번째 이야기를 기다립니다.</h3><p>공개된 멤버 후기가 등록되면 이곳에서 만나보실 수 있습니다.</p></div>}
      </section>
      <section className={styles.invitation}><p className={styles.eyebrow}>GET TO KNOW HANDA</p><h2>이야기 너머의 사람과 순간들.</h2><p>HANDA의 멤버와 모임 기록도 함께 살펴보세요.</p><div><Link href="/members">멤버 만나보기 ↗</Link><Link href="/stories">모임 후기 읽기 ↗</Link></div></section>
    </main>
    <footer className={styles.footer}><Link href="/" aria-label="HANDA 홈"><Image src="/brand/handa-logo-cream.svg" alt="HANDA · Berlin Founders Community" width={160} height={42}/></Link><span>시작하고, 함께 성장합니다.</span><span>© 2026 HANDA</span></footer>
  </div>;
}
