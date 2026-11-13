import type { CSSProperties, ReactNode } from "react";
import { type RichTextBlock, type RichTextDocument, type RichTextInline, type RichTextMap, type RichTextTextBlock } from "@/lib/content/rich-text";
import styles from "./rich-text.module.css";

export default function RichText({ document, text, inline = false }: { document?: RichTextDocument; text: string; inline?: boolean }) {
  function textNodes(content: RichTextInline[] = []): ReactNode {
    return content.map((node, index) => {
      if (node.type === "hardBreak") return <br key={index}/>;
      let result: ReactNode = node.text;
      for (const mark of node.marks ?? []) {
        if (mark.type === "bold") result = <strong>{result}</strong>;
        if (mark.type === "italic") result = <em>{result}</em>;
        if (mark.type === "underline") result = <u>{result}</u>;
        if (mark.type === "textStyle") result = <span style={{ fontSize: mark.attrs.fontSize, color: mark.attrs.color, fontFamily: mark.attrs.fontFamily }}>{result}</span>;
      }
      return <span key={index}>{result}</span>;
    });
  }
  function blockStyle(block: RichTextTextBlock): CSSProperties {
    return { textAlign: block.attrs?.textAlign, lineHeight: block.attrs?.lineHeight, marginInlineStart: block.attrs?.indent ? `${block.attrs.indent * 1.5}em` : undefined };
  }
  function blocks(content: RichTextBlock[]): ReactNode {
    return content.map((block, index) => {
      if (block.type === "paragraph") return <p key={index} style={blockStyle(block)}>{block.content?.length ? textNodes(block.content) : <br/>}</p>;
      if (block.type === "heading") {
        const Heading = `h${block.attrs.level + 1}` as "h2" | "h3" | "h4";
        return <Heading key={index} style={blockStyle(block)}>{textNodes(block.content)}</Heading>;
      }
      const children = block.content.map((item, i) => <li key={i} data-checked={item.type === "taskItem" ? item.attrs.checked : undefined}>
        {item.type === "taskItem" && <span className={styles.taskCheck} role="img" aria-label={item.attrs.checked ? "완료" : "미완료"}>{item.attrs.checked ? "✓" : ""}</span>}
        <div>{blocks(item.content)}</div>
      </li>);
      return block.type === "orderedList" ? <ol key={index} start={block.attrs?.start}>{children}</ol> : <ul key={index} className={block.type === "taskList" ? styles.taskList : undefined}>{children}</ul>;
    });
  }
  function inlineBlocks(content: RichTextBlock[]): ReactNode {
    return content.map((block, index) => {
      if (block.type === "paragraph" || block.type === "heading") {
        const layout = block.type === "heading" || Boolean(block.attrs && Object.keys(block.attrs).length);
        return <span key={index} style={{ ...blockStyle(block), ...(layout ? { display: "block" } : {}), ...(block.type === "heading" ? { fontWeight: 700, fontSize: ["1.5em", "1.25em", "1.1em"][block.attrs.level - 1] } : {}) }}>{index > 0 && !layout && <br/>}{textNodes(block.content)}</span>;
      }
      return <span key={index} role="list" style={{ display: "block", paddingInlineStart: "1.4em" }}>{block.content.map((item, i) => <span key={i} role="listitem" style={{ display: "block" }}>
        <span aria-hidden="true">{block.type === "orderedList" ? `${(block.attrs?.start ?? 1) + i}. ` : item.type === "taskItem" ? item.attrs.checked ? "☑ " : "☐ " : "• "}</span>{inlineBlocks(item.content)}
      </span>)}</span>;
    });
  }
  if (inline) return <span className={styles.inline}>{document ? inlineBlocks(document.content) : text}</span>;
  return <div className={styles.content}>{document ? blocks(document.content) : text.split(/\r?\n/).filter(Boolean).map((line, index) => <p key={index}>{line}</p>)}</div>;
}
export function ContentText({ content, field, inline = false, formatted = true }: { content: object & { richText?: RichTextMap }; field: string; inline?: boolean; formatted?: boolean }) {
  const value = (content as Record<string, unknown>)[field];
  return <RichText text={Array.isArray(value) ? value.join("\n") : String(value ?? "")} document={formatted ? content.richText?.[field] : undefined} inline={inline}/>;
}
