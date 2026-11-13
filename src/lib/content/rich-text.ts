import { z } from "zod";

export const fontSizes = Array.from({ length: 65 }, (_, i) => `${i + 8}px`);
export const fontFamilies = ["Arial", "Noto Sans KR", "Georgia", "Times New Roman", "Courier New", "Verdana"] as const;
export const lineHeights = ["1", "1.15", "1.5", "1.8", "2", "2.5", "3"] as const;
export function normalizeLineHeight(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(value)) return undefined;
  const height = Number(value);
  return height >= 0.5 && height <= 5 ? String(height) : undefined;
}
export const textColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/).transform(value => value.toLowerCase());
export function normalizeTextColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const hex = textColorSchema.safeParse(value.trim());
  if (hex.success) return hex.data;
  const rgb = /^rgb\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})\s*\)$/i.exec(value.trim());
  if (!rgb) return undefined;
  const channels = rgb.slice(1).map(Number);
  return channels.some(channel => channel > 255) ? undefined : "#" + channels.map(channel => channel.toString(16).padStart(2, "0")).join("");
}
const textStyleAttributes = z.object({
  fontSize: z.string().refine(value => fontSizes.includes(value), "Unsupported font size").optional(),
  color: textColorSchema.optional(), fontFamily: z.enum(fontFamilies).optional(),
}).strict().refine(attrs => Object.values(attrs).some(value => value !== undefined), "Empty text style");
const mark = z.discriminatedUnion("type", [
  z.object({ type: z.literal("bold") }).strict(), z.object({ type: z.literal("italic") }).strict(),
  z.object({ type: z.literal("underline") }).strict(), z.object({ type: z.literal("textStyle"), attrs: textStyleAttributes }).strict(),
]);
const inlineNode = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string().min(1).max(30000), marks: z.array(mark).max(4).optional() }).strict(),
  z.object({ type: z.literal("hardBreak") }).strict(),
]);
export type RichTextMark = z.infer<typeof mark>;
export type RichTextInline = z.infer<typeof inlineNode>;
const blockAttributes = z.object({
  textAlign: z.enum(["left", "center", "right", "justify"]).optional(),
  lineHeight: z.string().refine(value => normalizeLineHeight(value) !== undefined).optional(), indent: z.number().int().min(0).max(6).optional(),
  spaceBefore: z.number().int().min(0).max(120).optional(), spaceAfter: z.number().int().min(0).max(120).optional(),
  keepWithNext: z.boolean().optional(), keepTogether: z.boolean().optional(), widowControl: z.boolean().optional(), pageBreakBefore: z.boolean().optional(),
}).strict();
export type RichTextBlockAttributes = z.infer<typeof blockAttributes>;
export type RichTextTextBlock = { type: "paragraph"; attrs?: RichTextBlockAttributes; content?: RichTextInline[] }
  | { type: "heading"; attrs: RichTextBlockAttributes & { level: 1 | 2 | 3 }; content?: RichTextInline[] };
export type RichTextListItem = { type: "listItem"; content: RichTextBlock[] } | { type: "taskItem"; attrs: { checked: boolean }; content: RichTextBlock[] };
export type RichTextBlock = RichTextTextBlock | { type: "bulletList" | "orderedList" | "taskList"; attrs?: { start?: number }; content: RichTextListItem[] };
export type RichTextDocument = { type: "doc"; content: RichTextBlock[] };
const paragraphSchema = z.object({ type: z.literal("paragraph"), attrs: blockAttributes.optional(), content: z.array(inlineNode).max(3000).optional() }).strict();
const headingSchema = z.object({ type: z.literal("heading"), attrs: blockAttributes.extend({ level: z.union([z.literal(1), z.literal(2), z.literal(3)]) }), content: z.array(inlineNode).max(3000).optional() }).strict();
const blockSchema: z.ZodType<RichTextBlock> = z.lazy(() => z.union([
  paragraphSchema, headingSchema,
  z.object({ type: z.literal("bulletList"), content: z.array(listItemSchema).min(1).max(500) }).strict(),
  z.object({ type: z.literal("orderedList"), attrs: z.object({ start: z.number().int().min(1).max(10000).optional() }).strict().optional(), content: z.array(listItemSchema).min(1).max(500) }).strict(),
  z.object({ type: z.literal("taskList"), content: z.array(taskItemSchema).min(1).max(500) }).strict(),
]));
const listItemSchema: z.ZodType<RichTextListItem> = z.lazy(() => z.object({ type: z.literal("listItem"), content: z.array(blockSchema).min(1).max(500) }).strict());
const taskItemSchema: z.ZodType<RichTextListItem> = z.lazy(() => z.object({ type: z.literal("taskItem"), attrs: z.object({ checked: z.boolean() }).strict(), content: z.array(blockSchema).min(1).max(500) }).strict());
// Bound traversal before recursive parsing, including adversarial nested list payloads.
export const richTextDocumentSchema = z.preprocess((value, ctx) => {
  const stack = [{ value, depth: 0 }];
  let nodes = 0, characters = 0;
  while (stack.length) {
    const item = stack.pop()!;
    if (!item.value || typeof item.value !== "object") continue;
    const node = item.value as Record<string, unknown>;
    nodes++;
    if (typeof node.text === "string") characters += node.text.length;
    if (node.type === "hardBreak") characters++;
    if (nodes > 4000 || characters > 30000 || item.depth > 12) {
      ctx.addIssue({ code: "custom", message: "서식 내용이 너무 길거나 목록이 너무 깊습니다." });
      return z.NEVER;
    }
    if (Array.isArray(node.content)) for (const child of node.content) stack.push({ value: child, depth: item.depth + 1 });
  }
  return value;
}, z.object({ type: z.literal("doc"), content: z.array(blockSchema).max(500) }).strict());
export const richTextMapSchema = z.record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/), richTextDocumentSchema).refine(map => Object.keys(map).length <= 40, "Too many formatted fields");
export type RichTextMap = z.infer<typeof richTextMapSchema>;
export function richTextTextBlocks(doc: RichTextDocument): RichTextTextBlock[] {
  const blocks: RichTextTextBlock[] = [];
  function visit(nodes: RichTextBlock[]) {
    for (const node of nodes) {
      if (node.type === "paragraph" || node.type === "heading") blocks.push(node);
      else for (const item of node.content) visit(item.content);
    }
  }
  visit(doc.content);
  return blocks;
}
export function richTextPlain(doc: RichTextDocument): string {
  return richTextTextBlocks(doc).map(p => (p.content ?? []).map(n => n.type === "text" ? n.text : "\n").join("")).join("\n");
}
export function documentFromText(value: string): RichTextDocument {
  return { type: "doc", content: value.split(/\r?\n/).map(line => ({ type: "paragraph", ...(line ? { content: [{ type: "text", text: line } as const] } : {}) })) };
}
export function assertRichTextMatches(doc: RichTextDocument | undefined, value: string | string[], path: (string | number)[]) {
  if (!doc) return;
  const actual = richTextPlain(doc);
  const normalized = Array.isArray(value) ? actual.split(/\r?\n/).map(s => s.trim()).filter(Boolean).join("\n") : actual.trim();
  const expected = Array.isArray(value) ? value.join("\n") : value.trim();
  if (normalized !== expected) throw new z.ZodError([{ code: "custom", path, message: "서식과 본문 내용이 일치하지 않습니다." }]);
}
