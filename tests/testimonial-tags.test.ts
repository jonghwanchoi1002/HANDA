import assert from "node:assert/strict";
import { test } from "node:test";
import { testimonialSectionTags } from "../src/lib/content/testimonial-sections";
import { richTextPlain, type RichTextDocument } from "../src/lib/content/rich-text";

test("review tags split lines and paragraphs while ignoring empty items", () => {
  const items = testimonialSectionTags({ paragraphs: ["첫 태그\n둘째 태그", "", "   ", "셋째 태그"] });
  assert.deepEqual(items.map(item => item.text), ["첫 태그", "둘째 태그", "셋째 태그"]);
});

test("editor paragraphs, hard breaks and embedded newlines split without losing marks", () => {
  const bodyRichText: RichTextDocument = { type: "doc", content: [
    { type: "paragraph", content: [{ type: "text", text: "첫 태그", marks: [{ type: "bold" }] }, { type: "hardBreak" }, { type: "hardBreak" }, { type: "text", text: "둘째 태그\n셋째 태그", marks: [{ type: "textStyle", attrs: { color: "#a94a27" } }] }] },
    { type: "paragraph" },
    { type: "paragraph", content: [{ type: "text", text: "넷째 태그" }] },
  ] };
  const original = structuredClone(bodyRichText);
  const tags = testimonialSectionTags({ paragraphs: [], bodyRichText });
  assert.deepEqual(tags.map(item => richTextPlain(item.document)), ["첫 태그", "둘째 태그", "셋째 태그", "넷째 태그"]);
  assert.deepEqual(tags[0].document.content[0].content![0], { type: "text", text: "첫 태그", marks: [{ type: "bold" }] });
  assert.deepEqual(bodyRichText, original);
});
