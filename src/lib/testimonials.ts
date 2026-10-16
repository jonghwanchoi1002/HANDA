import "server-only";
import { testimonialRecords } from "@/data/testimonials";
import type { Testimonial } from "@/types/testimonial";

// Neon 연결 시 조회 구현을 교체합니다. 실제 추천사는 공개 동의를 받은 경우에만 반환합니다.
export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  return testimonialRecords
    .filter((item) => item.status === "published" && (item.isExample || item.publicationConsent))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    .map(({ id, name, introduction, quote, topic, photo, isExample }) => ({
      id, name, introduction, quote, topic, photo, isExample,
    }));
}
