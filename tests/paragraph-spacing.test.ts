import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeLineHeight, richTextDocumentSchema, richTextPlain, type RichTextDocument } from "../src/lib/content/rich-text";
import { cleanEditorDocument } from "../src/lib/content/rich-text-editor-document";

const document: RichTextDocument = { type: "doc", content: [{ type: "paragraph", attrs: {
  lineHeight: "1.37", spaceBefore: 12, spaceAfter: 24, keepWithNext: true, keepTogether: true, widowControl: false, pageBreakBefore: true,
}, content: [{ type: "text", text: "줄과 단락 간격" }] }] };

test("custom spacing and print pagination flags survive validation and editor cleanup", () => {
  assert.deepEqual(richTextDocumentSchema.parse(document), document);
  assert.deepEqual(cleanEditorDocument(document), document);
  assert.equal(richTextPlain(document), "줄과 단락 간격");
  assert.equal(normalizeLineHeight("1.50"), "1.5");
  for (const value of ["0.5", "1", "1.15", "1.37", "2", "5"]) assert.ok(normalizeLineHeight(value));
});

test("spacing accepts zero margins but rejects unsafe, excessive or malformed attributes", () => {
  const paragraph = document.content[0];
  assert.equal(richTextDocumentSchema.safeParse({ type: "doc", content: [{ ...paragraph, attrs: { spaceBefore: 0, spaceAfter: 0 } }] }).success, true);
  for (const attrs of [{ lineHeight: "0.49" }, { lineHeight: "5.01" }, { lineHeight: "1.333" }, { lineHeight: "url(x)" }, { lineHeight: "1;display:none" }, { spaceBefore: -1 }, { spaceAfter: 121 }, { spaceAfter: 1.5 }, { keepWithNext: "true" }, { widowControl: 0 }]) {
    assert.equal(richTextDocumentSchema.safeParse({ type: "doc", content: [{ ...paragraph, attrs }] }).success, false, JSON.stringify(attrs));
  }
});
