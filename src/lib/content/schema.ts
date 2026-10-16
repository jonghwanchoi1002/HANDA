import { z } from "zod";

const text = z.string().trim().min(1);
const webUrl = z.url().refine((url) => ["http:", "https:"].includes(new URL(url).protocol), "HTTP(S) URL required");
const imageUrl = z.string().refine((url) => url.startsWith("/") && !url.startsWith("//") || webUrl.safeParse(url).success, "Image URL required");
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const photo = z.object({ url: imageUrl, alt: text, width: z.number().int().positive(), height: z.number().int().positive() });
const storyImage = photo.extend({ id: text, caption: z.string() });
const block = z.discriminatedUnion("type", [
  z.object({ id: text, type: z.literal("paragraph"), text }),
  z.object({ id: text, type: z.literal("heading"), text }),
  z.object({ id: text, type: z.literal("image"), image: storyImage }),
]);
export const contentSchemas = {
  wiki: z.object({ slug, title: text, category: text, summary: text, isExample: z.boolean(), sections: z.array(z.object({ title: text, paragraphs: z.array(text).min(1) })).min(1) }),
  member: z.object({ slug, name: text, field: text, role: text, summary: text, introduction: z.array(text).min(1), interests: z.array(text), website: webUrl.nullable(), photoUrl: imageUrl.nullable(), isExample: z.boolean() }),
  story: z.object({ slug, title: text, summary: text, eventDate: z.iso.date(), location: text, cover: storyImage.nullable(), blocks: z.array(block).min(1).refine((blocks) => new Set(blocks.map((item) => item.id)).size === blocks.length, "Block IDs must be unique"), isExample: z.boolean() }),
  testimonial: z.object({ id: slug, name: text, introduction: text, quote: text, topic: text, photo: photo.nullable(), isExample: z.boolean() }),
  home: z.object({
    heroTitle: text, heroSubtitle: text, heroHighlight: text, heroDescription: z.array(text).min(1),
    aboutTitle: z.array(text).min(1), aboutLead: z.array(text).min(1), aboutDescription: text,
  }),
};
export type ContentKind = keyof typeof contentSchemas;
export type ContentMap = { [K in ContentKind]: z.infer<(typeof contentSchemas)[K]> };

export function parseContent<K extends ContentKind>(kind: K, value: unknown): ContentMap[K] {
  return contentSchemas[kind].parse(value) as ContentMap[K];
}
