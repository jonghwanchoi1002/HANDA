import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import RichText, { ContentText } from "@/components/rich-text";
import { getPublishedTestimonial } from "@/lib/testimonials";
import { getTestimonialSections } from "@/lib/content/testimonial-sections";
import TestimonialSectionContent from "@/components/testimonial-section-content";
import styles from "../testimonials.module.css";

type Props = { params: Promise<{ slug: string }> };
export const instant = false;
export const metadata: Metadata = { title: "멤버 후기 | HANDA" };

export default async function TestimonialPage({ params }: Props) {
  const { slug } = await params;
  const item = await getPublishedTestimonial(slug);
  if (!item) notFound();
  const sections=getTestimonialSections(item);
  const showJoinButton=Boolean(item.joinLabel&&item.joinUrl);
  const showClosing=Boolean(item.closingTitle||item.closingBody||showJoinButton);
  return <main className={`${styles.main} ${styles.detail}`}>
    <Link className={styles.back} href="/testimonials">← 멤버 후기 목록</Link>
    <article className={styles.reviewArticle}>
      <header className={styles.detailHeader}>
        <p className={styles.topicBadge}><ContentText content={item} field="topic" inline/></p>
        <h1><ContentText content={item} field="quote" inline/></h1>
        <div className={styles.author}>
          <div className={styles.avatar}>{item.photo ? <Image src={item.photo.url} alt={item.photo.alt} width={item.photo.width} height={item.photo.height} unoptimized/> : <span aria-hidden="true">{item.name.slice(0, 1)}</span>}</div>
          <div><h2><ContentText content={item} field="name" inline/></h2><p><ContentText content={item} field="introduction" inline/></p></div>
        </div>
      </header>
      <div className={styles.detailBody} role="region" aria-label="후기 본문">
        {sections.length ? sections.map((section,index)=><section className={styles.reviewSection} key={index}>
          {section.number&&<p className={styles.sectionNumber}>{section.number}</p>}
          {section.title&&<h2 className={styles.sectionTitle}><RichText text={section.title} document={section.titleRichText} inline/></h2>}
          <div className={styles.sectionBody}><TestimonialSectionContent section={section}/></div>
        </section>) : <p>자세한 후기를 준비하고 있습니다.</p>}
      </div>
      {showClosing&&<aside className={styles.joinBox} aria-label="HANDA 참여 안내">
        {item.closingTitle&&<h2><ContentText content={item} field="closingTitle" inline/></h2>}
        {item.closingBody&&<ContentText content={item} field="closingBody"/>}
        {showJoinButton&&<a className={styles.joinButton} href={item.joinUrl} target="_blank" rel="noopener noreferrer">{item.joinLabel}</a>}
      </aside>}
    </article>
    <Link className={styles.back} href="/testimonials">다른 멤버 후기 보기 →</Link>
  </main>;
}
