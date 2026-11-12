"use client";
import { useEffect, useId, useRef, type CSSProperties } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle, FontSize, Color } from "@tiptap/extension-text-style";
import { documentFromText,fontSizes,richTextPlain,normalizeTextColor,type RichTextDocument,type RichTextMark,type RichTextInline } from "@/lib/content/rich-text";
import styles from "./rich-text-editor.module.css";

function cleanDocument(raw:JSONContent):RichTextDocument{
  return {type:"doc",content:(raw.content??[]).filter(p=>p.type==="paragraph").map(p=>({type:"paragraph",content:(p.content??[]).flatMap<RichTextInline>(node=>{
    if(node.type==="hardBreak")return [{type:"hardBreak"} as const];
    if(node.type!=="text"||!node.text)return [];
    const marks:RichTextMark[]=[];
    for(const mark of node.marks??[]){
      if(mark.type==="bold"||mark.type==="italic"||mark.type==="underline")marks.push({type:mark.type});
      if(mark.type==="textStyle"){
        const fontSize=fontSizes.includes(mark.attrs?.fontSize)?mark.attrs!.fontSize:undefined;
        const color=normalizeTextColor(mark.attrs?.color);
        if(fontSize||color)marks.push({type:"textStyle",attrs:{...(fontSize?{fontSize}:{}),...(color?{color}:{})}});
      }
    }
    return [{type:"text",text:node.text,...(marks.length?{marks}:{})} as const];
  })}))};
}
const SafeFontSize=FontSize.extend({
  addGlobalAttributes(){return [{types:["textStyle"],attributes:{fontSize:{default:null,
    parseHTML:element=>fontSizes.includes(element.style.fontSize as typeof fontSizes[number])?element.style.fontSize:null,
    renderHTML:attributes=>fontSizes.includes(attributes.fontSize)?{style:`font-size: ${attributes.fontSize}`}:{},
  }}}];},
});
const SafeColor=Color.extend({
  addGlobalAttributes(){return [{types:["textStyle"],attributes:{color:{default:null,
    parseHTML:element=>normalizeTextColor(element.style.color)??null,
    renderHTML:attributes=>{const color=normalizeTextColor(attributes.color);return color?{style:`color: ${color}`}:{}} ,
  }}}];},
});
export default function RichTextEditor({label,name,value,document,onChange,disabled=false,compact=false,required=false,defaultColor="#231f1c"}:{
  label:string;name?:string;value:string;document?:RichTextDocument;onChange:(value:string,document:RichTextDocument)=>void;disabled?:boolean;compact?:boolean;required?:boolean;defaultColor?:string;
}){
  const id=useId();
  // Native color/size controls move focus away from the selected text.
  const selection=useRef<{from:number;to:number}|null>(null);
  const editor=useEditor({
    extensions:[StarterKit.configure({blockquote:false,bulletList:false,code:false,codeBlock:false,heading:false,horizontalRule:false,link:false,listItem:false,listKeymap:false,orderedList:false,strike:false,trailingNode:false}),TextStyle,SafeFontSize,SafeColor],
    immediatelyRender:false,
    content:document??documentFromText(value),
    editable:!disabled,
    editorProps:{attributes:{role:"textbox","aria-labelledby":id,"aria-multiline":"true","aria-required":String(required)},transformPastedText:text=>text.slice(0,30000)},
    onSelectionUpdate:({editor})=>{if(editor.isFocused)selection.current={from:editor.state.selection.from,to:editor.state.selection.to};},
    onUpdate:({editor})=>{selection.current={from:editor.state.selection.from,to:editor.state.selection.to};const doc=cleanDocument(editor.getJSON());onChange(richTextPlain(doc),doc);},
  });
  const selected=useEditorState({editor,selector:({editor})=>editor?{bold:editor.isActive("bold"),italic:editor.isActive("italic"),underline:editor.isActive("underline"),size:editor.getAttributes("textStyle").fontSize??"",color:normalizeTextColor(editor.getAttributes("textStyle").color)??""}:null});
  useEffect(()=>{if(editor)editor.setEditable(!disabled,false);},[editor,disabled]);
  useEffect(()=>{
    if(!editor)return;
    const desired=document??documentFromText(value);
    if(JSON.stringify(cleanDocument(editor.getJSON()))!==JSON.stringify(desired))editor.commands.setContent(desired,{emitUpdate:false});
  },[editor,document,value]);
  function rememberSelection(){
    if(editor)selection.current={from:editor.state.selection.from,to:editor.state.selection.to};
  }
  function formattingChain(){
    if(!editor)return;
    const chain=editor.chain().focus();
    const range=selection.current;
    // Resetting an unchanged cursor selection would clear marks for newly typed text.
    const current=editor.state.selection;
    return range&&range.to<=editor.state.doc.content.size&&(range.from!==current.from||range.to!==current.to)?chain.setTextSelection(range):chain;
  }
  return <div className={`${styles.wrapper} ${compact?styles.compact:""}`} style={{"--editor-text-color":defaultColor} as CSSProperties}>
    <span id={id} className={styles.label}>{label}</span>{name&&<input type="hidden" name={name} value={value}/>}
    <div className={styles.toolbar} role="toolbar" aria-label={`${label} 서식`} onPointerDownCapture={rememberSelection} onFocusCapture={rememberSelection}>
      <label className={styles.size}>글씨 크기<select aria-label={`${label} 글씨 크기`} value={selected?.size??""} disabled={disabled||!editor} onChange={event=>{if(event.target.value)formattingChain()?.setFontSize(event.target.value).run();else formattingChain()?.unsetFontSize().run();}}><option value="">기본</option>{fontSizes.map(size=><option key={size} value={size}>{size.replace("px","")}px</option>)}</select></label>
      <label className={styles.size}>글자 색상<input type="color" className={styles.color} aria-label={`${label} 글자 색상`} value={selected?.color||defaultColor} disabled={disabled||!editor} onChange={event=>formattingChain()?.setColor(event.target.value).run()}/></label>
      <button type="button" aria-label={`${label} 기본 색상으로`} disabled={disabled||!editor} onMouseDown={e=>e.preventDefault()} onClick={()=>formattingChain()?.unsetColor().run()}>기본 색상</button>
      <button type="button" aria-label={`${label} 굵게`} aria-pressed={selected?.bold??false} disabled={disabled||!editor} onMouseDown={e=>e.preventDefault()} onClick={()=>formattingChain()?.toggleBold().run()}><strong>굵게</strong></button>
      <button type="button" aria-label={`${label} 기울임`} aria-pressed={selected?.italic??false} disabled={disabled||!editor} onMouseDown={e=>e.preventDefault()} onClick={()=>formattingChain()?.toggleItalic().run()}><em>기울임</em></button>
      <button type="button" aria-label={`${label} 밑줄`} aria-pressed={selected?.underline??false} disabled={disabled||!editor} onMouseDown={e=>e.preventDefault()} onClick={()=>formattingChain()?.toggleUnderline().run()}><u>밑줄</u></button>
      <button type="button" aria-label={`${label} 서식 지우기`} disabled={disabled||!editor} onMouseDown={e=>e.preventDefault()} onClick={()=>formattingChain()?.unsetAllMarks().run()}>서식 지우기</button>
    </div>
    {editor?<EditorContent editor={editor} className={styles.area}/>:<p className={styles.loading} role="status">편집기를 불러오는 중입니다.</p>}
  </div>;
}
