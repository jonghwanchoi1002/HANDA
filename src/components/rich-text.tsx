import type { ReactNode } from "react";
import type { RichTextDocument,RichTextMap } from "@/lib/content/rich-text";
import styles from "./rich-text.module.css";

export default function RichText({document,text,inline=false}:{document?:RichTextDocument;text:string;inline?:boolean}){
  function paragraph(p:RichTextDocument["content"][number]){
    return (p.content??[]).map((node,index)=>{
      if(node.type==="hardBreak")return <br key={index}/>;
      let result:ReactNode=node.text;
      for(const mark of node.marks??[]){
        if(mark.type==="bold")result=<strong>{result}</strong>;
        if(mark.type==="italic")result=<em>{result}</em>;
        if(mark.type==="underline")result=<u>{result}</u>;
        if(mark.type==="textStyle")result=<span style={{fontSize:mark.attrs.fontSize}}>{result}</span>;
      }
      return <span key={index}>{result}</span>;
    });
  }
  if(inline)return <span className={styles.inline}>{document?document.content.map((p,index)=><span key={index}>{index>0&&<br/>}{paragraph(p)}</span>):text}</span>;
  return <div className={styles.content}>{document?document.content.map((p,index)=><p key={index}>{paragraph(p).length?paragraph(p):<br/>}</p>):text.split(/\r?\n/).filter(Boolean).map((line,index)=><p key={index}>{line}</p>)}</div>;
}
export function ContentText({content,field,inline=false}:{content:object&{richText?:RichTextMap};field:string;inline?:boolean}){
  const value=(content as Record<string,unknown>)[field];
  return <RichText text={Array.isArray(value)?value.join("\n"):String(value??"")} document={content.richText?.[field]} inline={inline}/>;
}
