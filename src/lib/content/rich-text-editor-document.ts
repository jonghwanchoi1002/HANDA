import type { JSONContent } from "@tiptap/core";
import { fontFamilies, fontSizes, lineHeights, normalizeTextColor, type RichTextBlock, type RichTextBlockAttributes, type RichTextDocument, type RichTextInline, type RichTextListItem, type RichTextMark } from "./rich-text";

/** Checklist controls were removed; preserve previously saved text as ordinary lists. */
export function documentForEditing(document: RichTextDocument): RichTextDocument {
  function visit(nodes: RichTextBlock[]): RichTextBlock[] {
    return nodes.map(node => {
      if (node.type === "paragraph" || node.type === "heading") return node;
      return { ...node, type: node.type === "taskList" ? "bulletList" : node.type, content: node.content.map(item => ({ type: "listItem" as const, content: visit(item.content) })) };
    });
  }
  return { type: "doc", content: visit(document.content) };
}

export function cleanEditorDocument(raw: JSONContent): RichTextDocument {
  function inline(content: JSONContent[] = []): RichTextInline[] {
    return content.flatMap<RichTextInline>(node => {
      if (node.type === "hardBreak") return [{ type: "hardBreak" }];
      if (node.type !== "text" || !node.text) return [];
      const marks: RichTextMark[] = [];
      for (const mark of node.marks ?? []) {
        if (mark.type === "bold" || mark.type === "italic" || mark.type === "underline") marks.push({ type: mark.type });
        if (mark.type === "textStyle") {
          const fontSize = fontSizes.includes(mark.attrs?.fontSize) ? mark.attrs!.fontSize : undefined;
          const color = normalizeTextColor(mark.attrs?.color);
          const fontFamily = fontFamilies.includes(mark.attrs?.fontFamily) ? mark.attrs!.fontFamily : undefined;
          if (fontSize || color || fontFamily) marks.push({ type: "textStyle", attrs: { ...(fontSize ? { fontSize } : {}), ...(color ? { color } : {}), ...(fontFamily ? { fontFamily } : {}) } });
        }
      }
      return [{ type: "text", text: node.text, ...(marks.length ? { marks } : {}) }];
    });
  }
  function blocks(content: JSONContent[] = []): RichTextBlock[] {
    return content.flatMap<RichTextBlock>(node => {
      if (node.type === "paragraph" || node.type === "heading") {
        const attrs: RichTextBlockAttributes = {};
        if (["left", "center", "right", "justify"].includes(node.attrs?.textAlign)) attrs.textAlign = node.attrs!.textAlign;
        if (lineHeights.includes(node.attrs?.lineHeight)) attrs.lineHeight = node.attrs!.lineHeight;
        if (Number.isInteger(node.attrs?.indent) && node.attrs!.indent > 0 && node.attrs!.indent <= 6) attrs.indent = node.attrs!.indent;
        if (node.type === "heading") return [{ type: "heading", attrs: { ...attrs, level: [1, 2, 3].includes(node.attrs?.level) ? node.attrs!.level : 1 }, content: inline(node.content) }];
        return [{ type: "paragraph", ...(Object.keys(attrs).length ? { attrs } : {}), content: inline(node.content) }];
      }
      if (node.type === "bulletList" || node.type === "orderedList" || node.type === "taskList") {
        const content = (node.content ?? []).flatMap<RichTextListItem>(item => {
          if (item.type !== "listItem" && item.type !== "taskItem") return [];
          const children = blocks(item.content);
          if (!children.length) children.push({ type: "paragraph", content: [] });
          return item.type === "taskItem" ? [{ type: "taskItem", attrs: { checked: Boolean(item.attrs?.checked) }, content: children }] : [{ type: "listItem", content: children }];
        });
        if (!content.length) return [];
        return [{ type: node.type, ...(node.type === "orderedList" && Number.isInteger(node.attrs?.start) && node.attrs!.start > 1 ? { attrs: { start: node.attrs!.start } } : {}), content }];
      }
      return [];
    });
  }
  return { type: "doc", content: blocks(raw.content) };
}
