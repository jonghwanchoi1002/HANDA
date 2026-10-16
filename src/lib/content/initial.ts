import { homeContent } from "@/data/home";
import { wikiArticles } from "@/data/wiki";
import { memberRecords } from "@/data/members";
import { storyRecords } from "@/data/stories";
import { testimonialRecords } from "@/data/testimonials";
import { type ContentKind } from "@/lib/content/schema";

export type InitialEntry = { kind: ContentKind; key: string; payload: unknown; status: string; consent: boolean; order: number };
export function getInitialContent(): InitialEntry[] {
  return [
    { kind: "home", key: "homepage", payload: homeContent, status: "published", consent: false, order: 0 },
    ...wikiArticles.map((article, index) => ({ kind: "wiki" as const, key: article.slug, payload: article, status: "published", consent: false, order: index })),
    ...memberRecords.map((member, index) => ({ kind: "member" as const, key: member.slug, payload: member, status: member.status, consent: false, order: index })),
    ...storyRecords.map((story, index) => ({ kind: "story" as const, key: story.slug, payload: story, status: story.status, consent: false, order: index })),
    ...testimonialRecords.map((item) => ({ kind: "testimonial" as const, key: item.id, payload: item, status: item.status, consent: item.publicationConsent, order: item.sortOrder })),
  ];
}
