"use client";
import { useEffect, useId } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle, FontSize } from "@tiptap/extension-text-style";
import { documentFromText,fontSizes,richTextPlain,type RichTextDocument,type RichTextMark,type RichTextInline } from "@/lib/content/rich-text";
import styles from "./rich-text-editor.module.css";

function cleanDocument(raw:JSONContent):RichTextDocument{
  return {type:"doc",content:(raw.content??[]).filter(p=>p.type==="paragraph").map(p=>({type:"paragraph",content:(p.content??[]).flatMap<RichTextInline>(node=>{
    if(node.type==="hardBreak")return [{type:"hardBreak"} as const];
    if(node.type!=="text"||!node.text)return [];
    const marks:RichTextMark[]=[];
    for(const mark of node.marks??[]){
      if(mark.type==="bold"||mark.type==="italic"||mark.type==="underline")marks.push({type:mark.type});
      if(mark.type==="textStyle"&&fontSizes.includes(mark.attrs?.fontSize))marks.push({type:"textStyle",attrs:{fontSize:mark.attrs!.fontSize}});
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
export default function RichTextEditor({label,name,value,document,onChange,disabled=false,compact=false,required=false}:{
  label:string;name?:string;value:string;document?:RichTextDocument;onChange:(value:string,document:RichTextDocument)=>void;disabled?:boolean;compact?:boolean;required?:boolean;
}){
  const id=useId();
  const editor=useEditor({
    extensions:[StarterKit.configure({blockquote:false,bulletList:false,code:false,codeBlock:false,heading:false,horizontalRule:false,link:false,listItem:false,listKeymap:false,orderedList:false,strike:false,trailingNode:false}),TextStyle,SafeFontSize],
    immediatelyRender:false,
    content:document??documentFromText(value),
    editable:!disabled,
    editorProps:{attributes:{role:"textbox","aria-labelledby":id,"aria-multiline":"true","aria-required":String(required)},transformPastedText:text=>text.slice(0,30000)},
    onUpdate:({editor})=>{const doc=cleanDocument(editor.getJSON());onChange(richTextPlain(doc),doc);},
  });
  const selected=useEditorState({editor,selector:({editor})=>editor?{bold:editor.isActive("bold"),italic:editor.isActive("italic"),underline:editor.isActive("underline"),size:editor.getAttributes("textStyle").fontSize??""}:null});
  useEffect(()=>{if(editor)editor.setEditable(!disabled,false);},[editor,disabled]);
  useEffect(()=>{
    if(!editor)return;
    const desired=document??documentFromText(value);
    if(JSON.stringify(cleanDocument(editor.getJSON()))!==JSON.stringify(desired))editor.commands.setContent(desired,{emitUpdate:false});
  },[editor,document,value]);
  return <div className={`${styles.wrapper} ${compact?styles.compact:""}`}>
    <span id={id} className={styles.label}>{label}</span>{name&&<input type="hidden" name={name} value={value}/>}
    <div className={styles.toolbar} role="toolbar" aria-label={`${label} 서식`}>
      <label className={styles.size}>글씨 크기<select aria-label={`${label} 글씨 크기`} value={selected?.size??""} disabled={disabled||!editor} onChange={event=>{if(event.target.value)editor?.chain().focus().setFontSize(event.target.value).run();else editor?.chain().focus().unsetFontSize().run();}}><option value="">기본</option>{fontSizes.map(size=><option key={size} value={size}>{size.replace("px","")}px</option>)}</select></label>
      <button type="button" aria-label={`${label} 굵게`} aria-pressed={selected?.bold??false} disabled={disabled||!editor} onMouseDown={e=>e.preventDefault()} onClick={()=>editor?.chain().focus().toggleBold().run()}><strong>굵게</strong></button>
      <button type="button" aria-label={`${label} 기울임`} aria-pressed={selected?.italic??false} disabled={disabled||!editor} onMouseDown={e=>e.preventDefault()} onClick={()=>editor?.chain().focus().toggleItalic().run()}><em>기울임</em></button>
      <button type="button" aria-label={`${label} 밑줄`} aria-pressed={selected?.underline??false} disabled={disabled||!editor} onMouseDown={e=>e.preventDefault()} onClick={()=>editor?.chain().focus().toggleUnderline().run()}><u>밑줄</u></button>
      <button type="button" aria-label={`${label} 서식 지우기`} disabled={disabled||!editor} onMouseDown={e=>e.preventDefault()} onClick={()=>editor?.chain().focus().unsetAllMarks().run()}>서식 지우기</button>
    </div>
    {editor?<EditorContent editor={editor} className={styles.area}/>:<p className={styles.loading} role="status">편집기를 불러오는 중입니다.</p>}
  </div>;
}
