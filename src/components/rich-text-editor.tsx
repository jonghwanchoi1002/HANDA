"use client";
import { LoadingIndicator } from "./loading-state";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle, FontSize, Color, FontFamily } from "@tiptap/extension-text-style";
import { documentFromText, fontSizes, fontFamilies, lineHeights, richTextPlain, normalizeTextColor, type RichTextDocument } from "@/lib/content/rich-text";
import EditorIcon from "./editor-icon";
import { cleanEditorDocument, documentForEditing } from "@/lib/content/rich-text-editor-document";
import styles from "./rich-text-editor.module.css";

const sizeChoices = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px", "48px"];

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
  const [menuLeft, setMenuLeft] = useState(0);
  const [openMenu, setOpenMenu] = useState<"alignment" | "spacing" | null>(null);
  const menuGroup = useRef<HTMLDivElement>(null);
  const alignTrigger = useRef<HTMLButtonElement>(null);
  const spacingTrigger = useRef<HTMLButtonElement>(null);
  const editor = useEditor({
    extensions: [StarterKit.configure({ blockquote: false, code: false, codeBlock: false, horizontalRule: false, link: false, strike: false, heading: { levels: [1, 2, 3] }, trailingNode: false }), TextStyle, SafeFontSize, SafeColor, SafeFontFamily, TextAlign.configure({ types: ["heading", "paragraph"] }), ParagraphLayout],
    immediatelyRender: false, content: documentForEditing(document ?? documentFromText(value)), editable: !disabled,
    editorProps: { attributes: { role: "textbox", "aria-labelledby": id, "aria-multiline": "true", "aria-required": String(required) }, transformPastedText: text => text.slice(0, 30000) },
    onSelectionUpdate: ({ editor }) => { if (editor.isFocused) selection.current = { from: editor.state.selection.from, to: editor.state.selection.to }; },
    onUpdate: ({ editor }) => { selection.current = { from: editor.state.selection.from, to: editor.state.selection.to }; const doc = cleanEditorDocument(editor.getJSON()); onChange(richTextPlain(doc), doc); },
  });
  const selected = useEditorState({ editor, selector: ({ editor }) => {
    if (!editor) return null;
    const attrs = editor.getAttributes(editor.isActive("heading") ? "heading" : "paragraph");
    return { bold: editor.isActive("bold"), italic: editor.isActive("italic"), underline: editor.isActive("underline"), size: editor.getAttributes("textStyle").fontSize ?? "", color: normalizeTextColor(editor.getAttributes("textStyle").color) ?? "", family: editor.getAttributes("textStyle").fontFamily ?? "", heading: editor.isActive("heading") ? String(attrs.level) : "paragraph", align: attrs.textAlign ?? "left", lineHeight: attrs.lineHeight ?? "", indent: attrs.indent ?? 0, bullet: editor.isActive("bulletList"), ordered: editor.isActive("orderedList"), undo: editor.can().undo(), redo: editor.can().redo() };
  } });

  useEffect(() => { if (editor) editor.setEditable(!disabled, false); }, [editor, disabled]);
  useEffect(() => {
    if (!editor) return;
    const desired = documentForEditing(document ?? documentFromText(value));
    if (JSON.stringify(cleanEditorDocument(editor.getJSON())) !== JSON.stringify(desired)) editor.commands.setContent(desired, { emitUpdate: false });
  }, [editor, document, value]);
  function rememberSelection() { if (editor && (editor.isFocused || !selection.current)) selection.current = { from: editor.state.selection.from, to: editor.state.selection.to }; }
  function chain() {
    if (!editor) return;
    const command = editor.chain().focus();
    const range = selection.current, current = editor.state.selection;
    return range && range.to <= editor.state.doc.content.size && (range.from !== current.from || range.to !== current.to) ? command.setTextSelection(range) : command;
  }
  function applyColor(value: string) {
    const color = normalizeTextColor(value);
    if (!editor || disabled || !color) return;
    // Keep the native color picker focused; only restore the editor's logical range.
    let command = editor.chain();
    const range = selection.current, current = editor.state.selection;
    if (range && range.to <= editor.state.doc.content.size && (range.from !== current.from || range.to !== current.to)) command = command.setTextSelection(range);
    command.setColor(color).run();
  }
  function layout(attrs: Record<string, unknown>) { chain()?.updateAttributes("paragraph", attrs).updateAttributes("heading", attrs).run(); }
  function indent(offset: number) {
    if (selected?.bullet || selected?.ordered) { if (offset > 0) chain()?.sinkListItem("listItem").run(); else chain()?.liftListItem("listItem").run(); }
    else layout({ indent: Math.max(0, Math.min(6, (selected?.indent ?? 0) + offset)) });
    setOpenMenu(null);
  }
  useEffect(() => {
    if (!openMenu) return;
    function outside(event: PointerEvent) { if (!menuGroup.current?.contains(event.target as Node)) setOpenMenu(null); }
    window.document.addEventListener("pointerdown", outside);
    return () => window.document.removeEventListener("pointerdown", outside);
  }, [openMenu]);
  useEffect(() => { if (disabled) setOpenMenu(null); }, [disabled]);
  function toggleMenu(kind: "alignment" | "spacing") {
    const next = openMenu === kind ? null : kind;
    if (next) {
      const trigger = (kind === "alignment" ? alignTrigger : spacingTrigger).current;
      const left = trigger?.getBoundingClientRect().left ?? 0;
      const width = kind === "alignment" ? 190 : 150;
      setMenuLeft(Math.max(8, Math.min(left, window.innerWidth - width - 8)) - left);
    }
    setOpenMenu(next);
    if (next) requestAnimationFrame(() => menuGroup.current?.querySelector<HTMLButtonElement>('[role="menu"] button:not(:disabled)')?.focus());
  }
  function menuKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!openMenu) return;
    if (event.key === "Escape") {
      event.preventDefault(); event.stopPropagation();
      (openMenu === "alignment" ? alignTrigger : spacingTrigger).current?.focus(); setOpenMenu(null); return;
    }
    if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      const buttons = Array.from(menuGroup.current?.querySelectorAll<HTMLButtonElement>('[role="menu"] button:not(:disabled)') ?? []);
      const index = buttons.indexOf(window.document.activeElement as HTMLButtonElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (["ArrowUp", "ArrowLeft"].includes(event.key) ? -1 : 1) + buttons.length) % buttons.length;
      event.preventDefault(); buttons[next]?.focus();
    }
    if (event.key === "Tab") setOpenMenu(null);
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
        <select className={styles.sizeSelect} aria-label={`${label} 글씨 크기`} value={selected?.size ?? ""} disabled={inactive} onChange={e => { if (e.target.value) chain()?.setFontSize(e.target.value).run(); else chain()?.unsetFontSize().run(); }}>
          <option value="">기본</option>
          {selected?.size && !sizeChoices.includes(selected.size) && <option value={selected.size}>{selected.size.replace("px", "")}</option>}
          {sizeChoices.map(size => <option key={size} value={size}>{size.replace("px", "")}</option>)}
        </select>
      </div>
      <div className={styles.group}>
        <button type="button" aria-label={`${label} 굵게`} title="굵게" aria-pressed={selected?.bold ?? false} disabled={inactive} onMouseDown={preventFocus} onClick={() => chain()?.toggleBold().run()}><strong>B</strong></button>
        <button type="button" aria-label={`${label} 기울임`} title="기울임" aria-pressed={selected?.italic ?? false} disabled={inactive} onMouseDown={preventFocus} onClick={() => chain()?.toggleItalic().run()}><em>I</em></button>
        <button type="button" aria-label={`${label} 밑줄`} title="밑줄" aria-pressed={selected?.underline ?? false} disabled={inactive} onMouseDown={preventFocus} onClick={() => chain()?.toggleUnderline().run()}><u>U</u></button>
        <label className={styles.colorControl} title="글자 색상" style={{ "--selected-color": selected?.color || defaultColor } as CSSProperties}>
          <span className={styles.colorLetter} aria-hidden="true">A</span><span className={styles.colorBar} aria-hidden="true"/>
          <input type="color" aria-label={`${label} 글자 색상`} value={selected?.color || defaultColor} disabled={inactive} onInput={e => applyColor(e.currentTarget.value)} onChange={e => applyColor(e.currentTarget.value)}/>
        </label>
      </div>
      <div className={styles.group} ref={menuGroup} onKeyDown={menuKeys}>
        <div className={styles.dropdown}>
          <button ref={alignTrigger} type="button" className={styles.menuTrigger} aria-label={`${label} 정렬 메뉴`} title="정렬 및 들여쓰기" aria-haspopup="menu" aria-expanded={openMenu === "alignment"} disabled={inactive} onMouseDown={preventFocus} onClick={() => toggleMenu("alignment")}><EditorIcon name={selected?.align === "center" ? "center" : selected?.align === "right" ? "right" : selected?.align === "justify" ? "justify" : "left"}/><EditorIcon name="chevron"/></button>
          {openMenu === "alignment" && <div className={styles.menu} style={{ left: menuLeft }} role="menu" aria-label={`${label} 정렬 및 들여쓰기`}>
            <div className={styles.alignmentChoices} role="group" aria-label="정렬">
              {([{ value: "left", text: "왼쪽 정렬" }, { value: "center", text: "가운데 정렬" }, { value: "right", text: "오른쪽 정렬" }, { value: "justify", text: "양쪽 정렬" }] as const).map(option => <button key={option.value} type="button" role="menuitemradio" aria-label={`${label} ${option.text}`} title={option.text} aria-checked={selected?.align === option.value} onMouseDown={preventFocus} onClick={() => { chain()?.setTextAlign(option.value).run(); setOpenMenu(null); }}><EditorIcon name={option.value}/></button>)}
            </div>
            <div className={styles.menuDivider}/>
            <button type="button" role="menuitem" aria-label={`${label} 내어쓰기`} onMouseDown={preventFocus} onClick={() => indent(-1)}><EditorIcon name="outdent"/><span>내어쓰기</span></button>
            <button type="button" role="menuitem" aria-label={`${label} 들여쓰기`} onMouseDown={preventFocus} onClick={() => indent(1)}><EditorIcon name="indent"/><span>들여쓰기</span></button>
          </div>}
        </div>
        <div className={styles.dropdown}>
          <button ref={spacingTrigger} type="button" className={styles.menuTrigger} aria-label={`${label} 줄 간격 메뉴`} title="줄 간격" aria-haspopup="menu" aria-expanded={openMenu === "spacing"} disabled={inactive} onMouseDown={preventFocus} onClick={() => toggleMenu("spacing")}><EditorIcon name="spacing"/><EditorIcon name="chevron"/></button>
          {openMenu === "spacing" && <div className={`${styles.menu} ${styles.spacingMenu}`} style={{ left: menuLeft }} role="menu" aria-label={`${label} 줄 간격`}>
            <button type="button" role="menuitemradio" aria-checked={!selected?.lineHeight} onMouseDown={preventFocus} onClick={() => { layout({ lineHeight: null }); setOpenMenu(null); }}>기본 간격</button>
            {lineHeights.map(height => <button key={height} type="button" role="menuitemradio" aria-label={`${label} 줄 간격 ${height}배`} aria-checked={selected?.lineHeight === height} onMouseDown={preventFocus} onClick={() => { layout({ lineHeight: height }); setOpenMenu(null); }}>{height}배</button>)}
          </div>}
        </div>
      </div>
      <div className={styles.group}>
        <button type="button" aria-label={`${label} 글머리표 목록`} title="글머리표 목록" aria-pressed={selected?.bullet ?? false} disabled={inactive} onMouseDown={preventFocus} onClick={() => chain()?.toggleBulletList().run()}><EditorIcon name="bullet"/></button>
        <button type="button" aria-label={`${label} 번호 목록`} title="번호 목록" aria-pressed={selected?.ordered ?? false} disabled={inactive} onMouseDown={preventFocus} onClick={() => chain()?.toggleOrderedList().run()}><EditorIcon name="numbered"/></button>
      </div>
      <div className={styles.group}>
        <button type="button" aria-label={`${label} 실행 취소`} title="실행 취소" disabled={inactive || !selected?.undo} onMouseDown={preventFocus} onClick={() => chain()?.undo().run()}><EditorIcon name="undo"/></button>
        <button type="button" aria-label={`${label} 다시 실행`} title="다시 실행" disabled={inactive || !selected?.redo} onMouseDown={preventFocus} onClick={() => chain()?.redo().run()}><EditorIcon name="redo"/></button>
        <button type="button" aria-label={`${label} 서식 지우기`} title="서식 지우기" disabled={inactive} onMouseDown={preventFocus} onClick={() => chain()?.clearNodes().unsetAllMarks().updateAttributes("paragraph", { textAlign: null, lineHeight: null, indent: 0 }).run()}><EditorIcon name="clear"/></button>
      </div>
    </div>
    {editor ? <EditorContent editor={editor} className={styles.area}/> : <div className={styles.loading}><LoadingIndicator message="편집기 불러오는 중"/></div>}
  </div>;
}
