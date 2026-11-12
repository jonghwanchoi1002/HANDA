import { getDatabaseContent } from "./content/source";
import "server-only";
import { testimonialRecords } from "@/data/testimonials";
import { parseContent } from "./content/schema";
import type { Testimonial } from "@/types/testimonial";

// 실제 추천사는 공개 동의를 받은 경우에만 반환합니다.
export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  const database = await getDatabaseContent("testimonial");
  if (database !== null) return database;
  return testimonialRecords
    .filter((item) => item.status === "published" && (item.isExample || item.publicationConsent))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    .map(item => parseContent("testimonial", item));
}

// 목록과 상세 페이지에 같은 공개 상태·동의 기준을 적용합니다.
export async function getPublishedTestimonial(id: string): Promise<Testimonial | undefined> {
  const database = await getDatabaseContent("testimonial", id);
  if (database !== null) return database[0];
  return (await getPublishedTestimonials()).find(item => item.id === id);
}
