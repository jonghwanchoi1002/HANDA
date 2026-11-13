import type { ContentMap } from "./schema";
import { documentFromText, richTextPlain, richTextTextBlocks, type RichTextDocument, type RichTextInline } from "./rich-text";

/** Split both editor paragraphs and Shift+Enter line breaks, preserving text marks. */
export function testimonialSectionTags(section: Pick<TestimonialSection, "paragraphs" | "bodyRichText">) {
  const source = section.bodyRichText ?? documentFromText(section.paragraphs.join("\n"));
  const items: { text: string; document: RichTextDocument }[] = [];
  let line: RichTextInline[] = [];
  function flush() {
    const document: RichTextDocument = { type: "doc", content: [{ type: "paragraph", content: line }] };
    const text = richTextPlain(document);
    if (text.trim()) items.push({ text, document });
    line = [];
  }
  for (const paragraph of richTextTextBlocks(source)) {
    for (const node of paragraph.content ?? []) {
      if (node.type === "hardBreak") flush();
      else node.text.split(/\r?\n/).forEach((text, index) => {
        if (index) flush();
        if (text) line.push({ ...node, text });
      });
    }
    flush();
  }
  return items;
}

export type TestimonialSection = NonNullable<ContentMap["testimonial"]["sections"]>[number];
// 이전 단일 본문을 읽을 때도 내용과 서식을 그대로 보존합니다.
export function getTestimonialSections(item: Pick<ContentMap["testimonial"],"sections"|"body"|"richText">): TestimonialSection[] {
  if(item.sections)return item.sections;
  if(!item.body?.trim())return [];
  return [{number:"",title:"",paragraphs:item.body.split(/\r?\n/).map(p=>p.trim()).filter(Boolean),highlight:false,bodyRichText:item.richText?.body}];
}
