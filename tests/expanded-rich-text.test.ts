import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanEditorDocument } from "../src/lib/content/rich-text-editor-document";
import { documentFromText, richTextDocumentSchema, richTextPlain, type RichTextDocument } from "../src/lib/content/rich-text";
import { testimonialSectionTags } from "../src/lib/content/testimonial-sections";

const document: RichTextDocument = { type: "doc", content: [
  { type: "heading", attrs: { level: 1, textAlign: "center", lineHeight: "1.5", indent: 1 }, content: [{ type: "text", text: "제목", marks: [{ type: "textStyle", attrs: { fontSize: "11px", fontFamily: "Georgia", color: "#a94a27" } }] }] },
  { type: "orderedList", attrs: { start: 3 }, content: [{ type: "listItem", content: [
    { type: "paragraph", content: [{ type: "text", text: "목록" }] },
    { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "하위 목록" }] }] }] },
  ] }] },
  { type: "taskList", content: [{ type: "taskItem", attrs: { checked: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "완료 항목", marks: [{ type: "bold" }] }] }] }] },
] };

test("expanded document validates without losing nested text, list order or marks", () => {
  assert.deepEqual(richTextDocumentSchema.parse(document), document);
  assert.deepEqual(cleanEditorDocument(document), document);
  assert.equal(richTextPlain(document), "제목\n목록\n하위 목록\n완료 항목");
  const tags = testimonialSectionTags({ paragraphs: [], bodyRichText: document });
  assert.deepEqual(tags.map(item => item.text), ["제목", "목록", "하위 목록", "완료 항목"]);
  assert.deepEqual(tags[3].document.content[0].content![0], { type: "text", text: "완료 항목", marks: [{ type: "bold" }] });
});

test("legacy paragraphs remain compatible and sanitizer removes defaults and unsafe pasted attributes", () => {
  const legacy = documentFromText("예전 글\n둘째 줄");
  assert.deepEqual(richTextDocumentSchema.parse(legacy), legacy);
  const clean = cleanEditorDocument({ type: "doc", content: [{ type: "paragraph", attrs: { textAlign: null, lineHeight: null, indent: 0, onclick: "bad" }, content: [{ type: "text", text: "본문", marks: [{ type: "textStyle", attrs: { fontFamily: "url(https://evil.test)", color: "rgb(169, 74, 39)", fontSize: "999px" } }] }] }] });
  assert.deepEqual(clean, { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "본문", marks: [{ type: "textStyle", attrs: { color: "#a94a27" } }] }] }] });
});

test("unsafe styles, unsupported nodes and deep recursive lists fail bounded validation", () => {
  for (const attrs of [{ textAlign: "url(x)" }, { indent: -1 }, { indent: 7 }, { lineHeight: "100px" }, { style: "background:red" }]) {
    assert.equal(richTextDocumentSchema.safeParse({ type: "doc", content: [{ type: "paragraph", attrs }] }).success, false);
  }
  for (const fontFamily of ["Arial;position:fixed", "url(https://evil.test)", "unknown-font"]) {
    assert.equal(richTextDocumentSchema.safeParse({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "textStyle", attrs: { fontFamily } }] }] }] }).success, false);
  }
  let node: object = { type: "paragraph", content: [{ type: "text", text: "nested" }] };
  for (let i = 0; i < 30; i++) node = { type: "bulletList", content: [{ type: "listItem", content: [node] }] };
  assert.equal(richTextDocumentSchema.safeParse({ type: "doc", content: [node] }).success, false);
  assert.equal(richTextDocumentSchema.safeParse(documentFromText("x".repeat(30001))).success, false);
});
