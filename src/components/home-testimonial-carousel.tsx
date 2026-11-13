"use client";

import { useRef, useState } from "react";
import { ContentText } from "@/components/rich-text";
import type { Testimonial } from "@/types/testimonial";
import styles from "./home-testimonial-carousel.module.css";
import home from "@/app/page.module.css";

export default function HomeTestimonialCarousel({ testimonials }: { testimonials: Pick<Testimonial, "id" | "quote" | "name" | "introduction">[] }) {
  const [active, setActive] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const count = testimonials.length;
  const move = (offset: number) => setActive(index => (index + offset + count) % count);
  if (!count) return <><h2>함께한 사람들의 목소리.</h2><p className={home.voiceAuthor}>참가자들의 진솔한 이야기를 준비하고 있습니다.</p></>;
  return <div className={styles.carousel} role="region" aria-roledescription="캐러셀" aria-label="멤버 후기" tabIndex={count > 1 ? 0 : undefined}
    onKeyDown={event => {
      if (count < 2) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); }
    }}>
    <div className={styles.row}>
      {count > 1 && <button type="button" className={styles.arrow} aria-label="이전 멤버 후기" onClick={() => move(-1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button>}
      <div className={styles.viewport}
        onTouchStart={event => { const first = event.touches[0]; touch.current = { x: first.clientX, y: first.clientY }; }}
        onTouchCancel={() => { touch.current = null; }}
        onTouchEnd={event => {
          const start = touch.current; touch.current = null;
          const end = event.changedTouches[0];
          if (!start || !end || count < 2) return;
          const dx = end.clientX - start.x, dy = end.clientY - start.y;
          if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
        }}>
        <div className={styles.track} style={{ transform: `translateX(-${active * 100}%)` }}>
          {testimonials.map((item, index) => <div key={item.id} className={styles.slide} role="group" aria-roledescription="슬라이드" aria-label={`${index + 1} / ${count}`} aria-hidden={index !== active} inert={index !== active}>
            <h2>“<ContentText content={item} field="quote" formatted={false} inline/>”</h2>
            <p className={home.voiceAuthor}><ContentText content={item} field="name" formatted={false} inline/> · <ContentText content={item} field="introduction" formatted={false} inline/></p>
          </div>)}
        </div>
      </div>
      {count > 1 && <button type="button" className={styles.arrow} aria-label="다음 멤버 후기" onClick={() => move(1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>}
    </div>
    {count > 1 && <div className={styles.controls}>
      <div className={styles.dots} aria-label="후기 선택">{testimonials.map((item, index) => <button key={item.id} type="button" aria-label={`${index + 1}번째 멤버 후기 보기`} aria-current={index === active ? "true" : undefined} onClick={() => setActive(index)}><span/></button>)}</div>
      <span className={styles.counter} role="status" aria-live="polite" aria-atomic="true">{active + 1} / {count}</span>
    </div>}
  </div>;
}
