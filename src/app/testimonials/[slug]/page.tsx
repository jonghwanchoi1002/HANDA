import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentText } from "@/components/rich-text";
import { getPublishedTestimonial } from "@/lib/testimonials";
import styles from "../testimonials.module.css";

type Props = { params: Promise<{ slug: string }> };
export const instant = false;
export const metadata: Metadata = { title: "멤버 후기 | HANDA" };

export default async function TestimonialPage({ params }: Props) {
  const { slug } = await params;
  const item = await getPublishedTestimonial(slug);
  if (!item) notFound();
  return <main className={`${styles.main} ${styles.detail}`}>
    <Link className={styles.back} href="/testimonials">← 멤버 후기 목록</Link>
    <article>
      <header className={styles.detailHeader}>
        <p className={styles.eyebrow}><ContentText content={item} field="topic" inline/></p>
        <h1><ContentText content={item} field="quote" inline/></h1>
        <div className={styles.author}>
          <div className={styles.avatar}>{item.photo ? <Image src={item.photo.url} alt={item.photo.alt} width={item.photo.width} height={item.photo.height} unoptimized/> : <span aria-hidden="true">{item.name.slice(0, 1)}</span>}</div>
          <div><h2><ContentText content={item} field="name" inline/></h2><p><ContentText content={item} field="introduction" inline/></p></div>
        </div>
      </header>
      {item.isExample && <aside className={styles.notice}>화면 개발을 위한 가상의 예시 후기입니다. 실제 멤버의 후기가 아닙니다.</aside>}
      <section className={styles.detailBody} aria-label="후기 본문">
        {item.body ? <ContentText content={item} field="body"/> : <p>자세한 후기를 준비하고 있습니다.</p>}
      </section>
    </article>
    <Link className={styles.back} href="/testimonials">다른 멤버 후기 보기 →</Link>
  </main>;
}
