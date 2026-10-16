import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublishedTestimonials } from "@/lib/testimonials";
import styles from "./testimonials.module.css";

export const metadata: Metadata = {
  title: "참가자 이야기 | HANDA",
  description: "연결과 배움, 그리고 성장. HANDA와 함께하는 사람들의 목소리를 담는 공간입니다.",
};

export default async function TestimonialsPage() {
  const testimonials = await getPublishedTestimonials();
  return <div className={styles.shell}>
    <a className={styles.skip} href="#testimonials-main">본문으로 바로가기</a>
    <header className={styles.header}><Link href="/" className={styles.logo}>HANDA<span>.</span></Link><nav aria-label="주 메뉴"><Link href="/#about">HANDA 소개</Link><Link href="/members">멤버</Link><Link href="/wiki">비즈니스 위키</Link><Link href="/stories">모임 후기</Link><Link href="/testimonials" aria-current="page">참가자 이야기</Link></nav></header>
    <main id="testimonials-main" className={styles.main}>
      <section className={styles.hero}><p className={styles.eyebrow}>VOICES OF HANDA</p><h1>함께한 사람들의<br /><span>목소리를 담습니다.</span></h1><p>연결되는 순간, 서로에게 배우는 시간.<br />HANDA와 함께하는 사람들의 이야기를 모아갑니다.</p></section>
      {testimonials.some((item) => item.isExample) && <aside className={styles.notice}>아래 예시 문구와 프로필은 화면 개발을 위해 만든 가상의 내용입니다. 실제 참가자의 추천사가 아닙니다.</aside>}
      <section aria-labelledby="voices-title" className={styles.voices}>
        <div className={styles.sectionHeading}><h2 id="voices-title">연결, 배움, 성장의 이야기</h2><p>총 {testimonials.length}개의 이야기</p></div>
        {testimonials.length ? <div className={styles.grid}>{testimonials.map((item) => <article className={styles.card} key={item.id}>
          <div className={styles.cardTop}><span>{item.topic}</span>{item.isExample && <span>예시 문구</span>}</div>
          <span className={styles.quoteMark} aria-hidden="true">“</span><blockquote><p>{item.quote}</p></blockquote>
          <div className={styles.author}><div className={styles.avatar}>{item.photo ? <Image src={item.photo.url} alt={item.photo.alt} width={item.photo.width} height={item.photo.height} unoptimized /> : <span aria-hidden="true">✳</span>}</div><div><h3>{item.name}</h3><p>{item.introduction}</p></div></div>
        </article>)}</div> : <div className={styles.empty}><h3>첫 번째 이야기를 기다립니다.</h3><p>공개된 참가자 이야기가 등록되면 이곳에서 만나보실 수 있습니다.</p></div>}
      </section>
      <section className={styles.invitation}><p className={styles.eyebrow}>GET TO KNOW HANDA</p><h2>이야기 너머의 사람과 순간들.</h2><p>HANDA의 멤버와 모임 기록도 함께 살펴보세요.</p><div><Link href="/members">멤버 만나보기 ↗</Link><Link href="/stories">모임 후기 읽기 ↗</Link></div></section>
    </main>
    <footer className={styles.footer}><Link href="/">HANDA.</Link><span>시작하고, 함께 성장합니다.</span><span>© 2026 HANDA</span></footer>
  </div>;
}
