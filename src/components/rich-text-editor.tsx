"use client";
import { LoadingIndicator } from "./loading-state";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { TextStyle, FontSize, Color, FontFamily } from "@tiptap/extension-text-style";
import { documentFromText, fontSizes, fontFamilies, lineHeights, richTextPlain, normalizeTextColor, type RichTextDocument } from "@/lib/content/rich-text";
import { cleanEditorDocument } from "@/lib/content/rich-text-editor-document";
import styles from "./rich-text-editor.module.css";

const SafeFontSize = FontSize.extend({
  addGlobalAttributes() { return [{ types: ["textStyle"], attributes: { fontSize: { default: null,
    parseHTML: element => fontSizes.includes(element.style.fontSize) ? element.style.fontSize : null,
    renderHTML: attrs => fontSizes.includes(attrs.fontSize) ? { style: `font-size: ${attrs.fontSize}` } : {},
  } } }]; },
});
const SafeColor = Color.extend({
  addGlobalAttributes() { return [{ types: ["textStyle"], attributes: { color: { default: null,
    parseHTML: element => normalizeTextColor(element.style.color) ?? null,
    renderHTML: attrs => { const color = normalizeTextColor(attrs.color); return color ? { style: `color: ${color}` } : {}; },
  } } }]; },
});
const SafeFontFamily = FontFamily.extend({
  addGlobalAttributes() { return [{ types: ["textStyle"], attributes: { fontFamily: { default: null,
    parseHTML: element => { const family = element.style.fontFamily.replace(/["']/g, ""); return fontFamilies.some(value => value === family) ? family : null; },
    renderHTML: attrs => fontFamilies.includes(attrs.fontFamily) ? { style: `font-family: ${attrs.fontFamily}` } : {},
  } } }]; },
});
const ParagraphLayout = Extension.create({
  name: "paragraphLayout",
  addGlobalAttributes() { return [{ types: ["paragraph", "heading"], attributes: {
    lineHeight: { default: null, parseHTML: el => lineHeights.includes(el.style.lineHeight as typeof lineHeights[number]) ? el.style.lineHeight : null,
      renderHTML: attrs => lineHeights.includes(attrs.lineHeight) ? { style: `line-height: ${attrs.lineHeight}` } : {} },
    indent: { default: 0, parseHTML: el => Math.max(0, Math.min(6, Number(el.getAttribute("data-indent")) || 0)),
      renderHTML: attrs => attrs.indent > 0 && attrs.indent <= 6 ? { "data-indent": attrs.indent, style: `margin-inline-start: ${attrs.indent * 1.5}em` } : {} },
  } }]; },
});

type Props = { label: string; name?: string; value: string; document?: RichTextDocument; onChange: (value: string, document: RichTextDocument) => void; disabled?: boolean; compact?: boolean; required?: boolean; defaultColor?: string };
export default function RichTextEditor({ label, name, value, document, onChange, disabled = false, compact = false, required = false, defaultColor = "#231f1c" }: Props) {
  const id = useId();
  const selection = useRef<{ from: number; to: number } | null>(null);
  const [sizeDraft, setSizeDraft] = useState("16");
  const editor = useEditor({
    extensions: [StarterKit.configure({ blockquote: false, code: false, codeBlock: false, horizontalRule: false, link: false, strike: false, heading: { levels: [1, 2, 3] }, trailingNode: false }), TextStyle, SafeFontSize, SafeColor, SafeFontFamily, TextAlign.configure({ types: ["heading", "paragraph"] }), ParagraphLayout, TaskList, TaskItem.configure({ nested: true })],
    immediatelyRender: false, content: document ?? documentFromText(value), editable: !disabled,
    editorProps: { attributes: { role: "textbox", "aria-labelledby": id, "aria-multiline": "true", "aria-required": String(required) }, transformPastedText: text => text.slice(0, 30000) },
    onSelectionUpdate: ({ editor }) => { if (editor.isFocused) selection.current = { from: editor.state.selection.from, to: editor.state.selection.to }; },
    onUpdate: ({ editor }) => { selection.current = { from: editor.state.selection.from, to: editor.state.selection.to }; const doc = cleanEditorDocument(editor.getJSON()); onChange(richTextPlain(doc), doc); },
  });
  const selected = useEditorState({ editor, selector: ({ editor }) => {
    if (!editor) return null;
    const attrs = editor.getAttributes(editor.isActive("heading") ? "heading" : "paragraph");
    return { bold: editor.isActive("bold"), italic: editor.isActive("italic"), underline: editor.isActive("underline"), size: editor.getAttributes("textStyle").fontSize ?? "", color: normalizeTextColor(editor.getAttributes("textStyle").color) ?? "", family: editor.getAttributes("textStyle").fontFamily ?? "", heading: editor.isActive("heading") ? String(attrs.level) : "paragraph", align: attrs.textAlign ?? "left", lineHeight: attrs.lineHeight ?? "", indent: attrs.indent ?? 0, bullet: editor.isActive("bulletList"), ordered: editor.isActive("orderedList"), task: editor.isActive("taskList"), undo: editor.can().undo(), redo: editor.can().redo() };
  } });
  useEffect(() => { setSizeDraft(String(parseInt(selected?.size || "16", 10))); }, [selected?.size]);
  useEffect(() => { if (editor) editor.setEditable(!disabled, false); }, [editor, disabled]);
  useEffect(() => {
    if (!editor) return;
    const desired = document ?? documentFromText(value);
    if (JSON.stringify(cleanEditorDocument(editor.getJSON())) !== JSON.stringify(desired)) editor.commands.setContent(desired, { emitUpdate: false });
  }, [editor, document, value]);
  function rememberSelection() { if (editor) selection.current = { from: editor.state.selection.from, to: editor.state.selection.to }; }
  function chain() {
    if (!editor) return;
    const command = editor.chain().focus();
    const range = selection.current, current = editor.state.selection;
    return range && range.to <= editor.state.doc.content.size && (range.from !== current.from || range.to !== current.to) ? command.setTextSelection(range) : command;
  }
  function setSize(value: number) { const size = Math.max(8, Math.min(72, Number.isFinite(value) ? Math.round(value) : 16)); setSizeDraft(String(size)); chain()?.setFontSize(`${size}px`).run(); }
  function layout(attrs: Record<string, unknown>) { chain()?.updateAttributes("paragraph", attrs).updateAttributes("heading", attrs).run(); }
  function indent(offset: number) {
    if (selected?.task) { if (offset > 0) chain()?.sinkListItem("taskItem").run(); else chain()?.liftListItem("taskItem").run(); }
    else if (selected?.bullet || selected?.ordered) { if (offset > 0) chain()?.sinkListItem("listItem").run(); else chain()?.liftListItem("listItem").run(); }
    else layout({ indent: Math.max(0, Math.min(6, (selected?.indent ?? 0) + offset)) });
  }
  const inactive = disabled || !editor;
  const preventFocus = (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault();
  return <div className={`${styles.wrapper} ${compact ? styles.compact : ""}`} style={{ "--editor-text-color": defaultColor } as CSSProperties}>
    <span id={id} className={styles.label}>{label}</span>{name && <input type="hidden" name={name} value={value}/>}
    <div className={styles.toolbar} role="toolbar" aria-label={`${label} 서식`} onPointerDownCapture={rememberSelection} onFocusCapture={rememberSelection}>
      <div className={styles.group}>
        <select aria-label={`${label} 문단 스타일`} value={selected?.heading ?? "paragraph"} disabled={inactive} onChange={e => { if (e.target.value === "paragraph") chain()?.setParagraph().run(); else chain()?.setHeading({ level: Number(e.target.value) as 1 | 2 | 3 }).run(); }}><option value="paragraph">일반 텍스트</option><option value="1">제목 1</option><option value="2">제목 2</option><option value="3">제목 3</option></select>
        <select aria-label={`${label} 글꼴`} value={selected?.family ?? ""} disabled={inactive} onChange={e => { if (e.target.value) chain()?.setFontFamily(e.target.value).run(); else chain()?.unsetFontFamily().run(); }}><option value="">기본 글꼴</option>{fontFamilies.map(family => <option key={family} value={family}>{family}</option>)}</select>
      </div>
      <div className={styles.group}>
        <button type="button" aria-label={`${label} 글씨 크기 줄이기`} title="글씨 크기 줄이기" disabled={inactive} onMouseDown={preventFocus} onClick={() => setSize(Number(sizeDraft) - 1)}>−</button>
        <input className={styles.fontSize} type="number" min={8} max={72} step={1} aria-label={`${label} 글씨 크기`} value={sizeDraft} disabled={inactive} onChange={e => { setSizeDraft(e.target.value); const size = Number(e.target.value); if (size >= 8 && size <= 72 && Number.isInteger(size)) chain()?.setFontSize(`${size}px`).run(); }} onBlur={() => setSize(Number(sizeDraft))} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); setSize(Number(sizeDraft)); } }}/>
        <button type="button" aria-label={`${label} 글씨 크기 늘리기`} title="글씨 크기 늘리기" disabled={inactive} onMouseDown={preventFocus} onClick={() => setSize(Number(sizeDraft) + 1)}>+</button>
      </div>
      <div className={styles.group}>
        <button type="button" aria-label={`${label} 굵게`} title="굵게" aria-pressed={selected?.bold ?? false} disabled={inactive} onMouseDown={preventFocus} onClick={() => chain()?.toggleBold().run()}><strong>B</strong></button>
        <button type="button" aria-label={`${label} 기울임`} title="기울임" aria-pressed={selected?.italic ?? false} disabled={inactive} onMouseDown={preventFocus} onClick={() => chain()?.toggleItalic().run()}><em>I</em></button>
        <button type="button" aria-label={`${label} 밑줄`} title="밑줄" aria-pressed={selected?.underline ?? false} disabled={inactive} onMouseDown={preventFocus} onClick={() => chain()?.toggleUnderline().run()}><u>U</u></button>
        <label className={styles.colorControl} title="글자 색상"><span>A</span><input type="color" aria-label={`${label} 글자 색상`} value={selected?.color || defaultColor} disabled={inactive} onChange={e => chain()?.setColor(e.target.value).run()}/></label>
        <button type="button" aria-label={`${label} 기본 색상으로`} title="기본 색상" disabled={inactive} onMouseDown={preventFocus} onClick={() => chain()?.unsetColor().run()}>기본 색상</button>
      </div>
      <div className={styles.group}>
        <select aria-label={`${label} 정렬`} value={selected?.align ?? "left"} disabled={inactive} onChange={e => chain()?.setTextAlign(e.target.value).run()}><option value="left">왼쪽 정렬</option><option value="center">가운데 정렬</option><option value="right">오른쪽 정렬</option><option value="justify">양쪽 정렬</option></select>
        <select aria-label={`${label} 줄 간격`} value={selected?.lineHeight ?? ""} disabled={inactive} onChange={e => layout({ lineHeight: e.target.value || null })}><option value="">줄 간격</option>{lineHeights.map(height => <option key={height} value={height}>{height}배</option>)}</select>
      </div>
      <div className={styles.group}>
        <button type="button" aria-label={`${label} 체크리스트`} title="체크리스트" aria-pressed={selected?.task ?? false} disabled={inactive} onMouseDown={preventFocus} onClick={() => chain()?.toggleTaskList().run()}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8 12 3 3 5-6"/></svg></button>
        <button type="button" aria-label={`${label} 글머리표 목록`} title="글머리표 목록" aria-pressed={selected?.bullet ?? false} disabled={inactive} onMouseDown={preventFocus} onClick={() => chain()?.toggleBulletList().run()}>• ≡</button>
        <button type="button" aria-label={`${label} 번호 목록`} title="번호 목록" aria-pressed={selected?.ordered ?? false} disabled={inactive} onMouseDown={preventFocus} onClick={() => chain()?.toggleOrderedList().run()}>1. ≡</button>
        <button type="button" aria-label={`${label} 내어쓰기`} title="내어쓰기" disabled={inactive} onMouseDown={preventFocus} onClick={() => indent(-1)}>⇤</button>
        <button type="button" aria-label={`${label} 들여쓰기`} title="들여쓰기" disabled={inactive} onMouseDown={preventFocus} onClick={() => indent(1)}>⇥</button>
      </div>
      <div className={styles.group}>
        <button type="button" aria-label={`${label} 실행 취소`} title="실행 취소" disabled={inactive || !selected?.undo} onMouseDown={preventFocus} onClick={() => chain()?.undo().run()}>↶</button>
        <button type="button" aria-label={`${label} 다시 실행`} title="다시 실행" disabled={inactive || !selected?.redo} onMouseDown={preventFocus} onClick={() => chain()?.redo().run()}>↷</button>
        <button type="button" aria-label={`${label} 서식 지우기`} title="서식 지우기" disabled={inactive} onMouseDown={preventFocus} onClick={() => chain()?.clearNodes().unsetAllMarks().updateAttributes("paragraph", { textAlign: null, lineHeight: null, indent: 0 }).run()}>서식 지우기</button>
      </div>
    </div>
    {editor ? <EditorContent editor={editor} className={styles.area}/> : <div className={styles.loading}><LoadingIndicator message="편집기 불러오는 중"/></div>}
  </div>;
}
