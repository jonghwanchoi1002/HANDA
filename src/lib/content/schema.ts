import { z } from "zod";
import { richTextDocumentSchema,richTextMapSchema,assertRichTextMatches } from "./rich-text";
import { homeAboutDefaults } from "./home-defaults";

const text = z.string().trim().min(1);
const webUrl = z.url().refine((url) => ["http:", "https:"].includes(new URL(url).protocol), "HTTP(S) URL required");
const imageUrl = z.string().refine((url) => url.startsWith("/") && !url.startsWith("//") || webUrl.safeParse(url).success, "Image URL required");
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const photo = z.object({ url: imageUrl, alt: text, width: z.number().int().positive(), height: z.number().int().positive() });
const storyImage = photo.extend({ id: text, caption: z.string() });
const block = z.discriminatedUnion("type", [
  z.object({ id: text, type: z.literal("paragraph"), text, richText:richTextDocumentSchema.optional() }),
  z.object({ id: text, type: z.literal("heading"), text, richText:richTextDocumentSchema.optional() }),
  z.object({ id: text, type: z.literal("image"), image: storyImage }),
]);
export const contentSchemas = {
  wiki: z.object({ richText:richTextMapSchema.optional(), photos: z.array(photo).max(10).optional(), slug, title: text, category: text, summary: text, isExample: z.boolean(), sections: z.array(z.object({ title: text, paragraphs: z.array(text).min(1), titleRichText:richTextDocumentSchema.optional(), bodyRichText:richTextDocumentSchema.optional() })).min(1) }),
  member: z.object({ richText:richTextMapSchema.optional(), slug, name: text, field: text, role: text, summary: text, introduction: z.array(text).min(1), interests: z.array(text), website: webUrl.nullable(), photoUrl: imageUrl.nullable(), isExample: z.boolean() }),
  story: z.object({ richText:richTextMapSchema.optional(), slug, title: text, summary: text, eventDate: z.iso.date(), location: text, cover: storyImage.nullable(), blocks: z.array(block).min(1).refine((blocks) => new Set(blocks.map((item) => item.id)).size === blocks.length, "Block IDs must be unique"), isExample: z.boolean() }),
  testimonial: z.object({ richText:richTextMapSchema.optional(), id: slug, name: text, introduction: text, quote: text, body: z.string().trim().max(30000).optional(), topic: text, photo: photo.nullable(), isExample: z.boolean() }),
  page: z.object({
    slug:z.enum(["about","guide","join"]),title:text,heading:text,body:text,isExample:z.literal(false),
    secondaryHeading:z.string().trim(),secondaryBody:z.string().trim(),
    ctaLabel:text,ctaUrl:webUrl,richText:richTextMapSchema.optional(),
  }),
  home: z.object({
    richText:richTextMapSchema.optional(), heroTitle: text, heroSubtitle: text, heroHighlight: text, heroDescription: z.array(text).min(1),
    aboutTitle: z.array(text).min(1), aboutLead: z.array(text), aboutDescription: z.string().trim(),
    aboutValue1Title: text.default(homeAboutDefaults.aboutValue1Title),
    aboutValue1Description: text.default(homeAboutDefaults.aboutValue1Description),
    aboutValue2Title: text.default(homeAboutDefaults.aboutValue2Title),
    aboutValue2Description: text.default(homeAboutDefaults.aboutValue2Description),
    aboutValue3Title: text.default(homeAboutDefaults.aboutValue3Title),
    aboutValue3Description: text.default(homeAboutDefaults.aboutValue3Description),
  }),
};
export type ContentKind = keyof typeof contentSchemas;
export type ContentMap = { [K in ContentKind]: z.infer<(typeof contentSchemas)[K]> };

export function parseContent<K extends ContentKind>(kind: K, value: unknown): ContentMap[K] {
  const payload=contentSchemas[kind].parse(value) as ContentMap[K];
  for(const [key,doc] of Object.entries(payload.richText??{})){
    const plain=(payload as Record<string,unknown>)[key];
    if(typeof plain!=="string"&&!(Array.isArray(plain)&&plain.every(v=>typeof v==="string")))throw new z.ZodError([{code:"custom",path:["richText",key],message:"서식을 적용할 수 없는 항목입니다."}]);
    assertRichTextMatches(doc,plain as string|string[],["richText",key]);
  }
  if("sections" in payload)payload.sections.forEach((section,index)=>{
    assertRichTextMatches(section.titleRichText,section.title,["sections",index,"titleRichText"]);
    assertRichTextMatches(section.bodyRichText,section.paragraphs,["sections",index,"bodyRichText"]);
  });
  if("blocks" in payload)payload.blocks.forEach((block,index)=>{
    if(block.type!=="image")assertRichTextMatches(block.richText,block.text,["blocks",index,"richText"]);
  });
  return payload;
}
