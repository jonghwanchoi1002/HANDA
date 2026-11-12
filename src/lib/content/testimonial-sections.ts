import type { ContentMap } from "./schema";

export type TestimonialSection = NonNullable<ContentMap["testimonial"]["sections"]>[number];
// 이전 단일 본문을 읽을 때도 내용과 서식을 그대로 보존합니다.
export function getTestimonialSections(item: Pick<ContentMap["testimonial"],"sections"|"body"|"richText">): TestimonialSection[] {
  if(item.sections)return item.sections;
  if(!item.body?.trim())return [];
  return [{number:"",title:"",paragraphs:item.body.split(/\r?\n/).map(p=>p.trim()).filter(Boolean),highlight:false,bodyRichText:item.richText?.body}];
}
