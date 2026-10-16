"use client";
import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { editorFields } from "@/lib/content/editor-fields";
import type { ManagedContent } from "@/lib/content/management";
import type { ContentMap } from "@/lib/content/schema";
import { saveContent, type SaveState } from "./actions";
import common from "@/app/login/auth.module.css";
import styles from "./content.module.css";

type Section = {title:string;body:string};
type Block = ContentMap["story"]["blocks"][number];
const lines=(value:FormDataEntryValue|null)=>String(value ?? "").split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
export default function ContentEditor({entry: initialEntry}:{entry:ManagedContent}) {
  const [entry]=useState(initialEntry);
  const router=useRouter();
  const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(editorFields[entry.kind].map(field=>{
    const value=entry.payload[field.key];return [field.key,Array.isArray(value)?value.join("\n"):String(value ?? "")];
  })));
  const [status,setStatus]=useState(entry.status);
  const [order,setOrder]=useState(String(entry.order));
  const [example,setExample]=useState(Boolean(entry.payload.isExample));
  const [consent,setConsent]=useState(entry.consent);
  const [sections,setSections]=useState<Section[]>(()=>((entry.payload.sections ?? []) as ContentMap["wiki"]["sections"]).map(section=>({title:section.title,body:section.paragraphs.join("\n")})));
  const [blocks,setBlocks]=useState<Block[]>(()=>entry.payload.blocks as Block[] ?? []);
  const [dirty,setDirty]=useState(false);
  useEffect(()=>{
    if(!dirty)return;
    const beforeUnload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
    window.addEventListener("beforeunload",beforeUnload);
    return ()=>window.removeEventListener("beforeunload",beforeUnload);
  },[dirty]);
  const [state,action,pending]=useActionState(async(previous:SaveState,form:FormData):Promise<SaveState>=>{
    const payload={...entry.payload};
    for (const field of editorFields[entry.kind]) {
      const value=form.get(field.key);
      payload[field.key]=field.type==="lines" ? lines(value) : field.type==="url" && !String(value ?? "").trim() ? null : String(value ?? "").trim();
    }
    if(entry.kind!=="home") payload.isExample=form.get("isExample")==="on";
    if(entry.kind==="wiki") payload.sections=sections.map(section=>({title:section.title,paragraphs:lines(section.body)}));
    if(entry.kind==="story") payload.blocks=blocks;
    const request=new FormData();request.set("entry",JSON.stringify({...entry,payload,revision:previous.revision ?? entry.revision,status:entry.kind==="home"?"published":String(form.get("status")),consent:form.get("consent")==="on",order:Number(form.get("order"))}));
    const result=await saveContent(previous,request);
    if(result.saved) {
      setDirty(false);
      if(entry.revision===0 && result.path) router.replace(result.path);
    }
    // 실패 후에도 직전에 저장한 버전 번호를 유지합니다.
    return {...result,revision:result.revision ?? previous.revision};
  },{message:""});
  function move<T>(items:T[],index:number,offset:number):T[] { const result=[...items];const next=index+offset;if(next<0||next>=items.length)return items;[result[index],result[next]]=[result[next],result[index]];return result; }
  const confirmLeave=(event:React.MouseEvent<HTMLAnchorElement>)=>{if(dirty&&!window.confirm("저장하지 않은 변경 내용이 있습니다. 페이지를 이동할까요?"))event.preventDefault();};
  return <form action={action} onChange={()=>setDirty(true)} className={styles.editor}>
    <fieldset disabled={pending}><legend>기본 내용</legend>{editorFields[entry.kind].map(field=>{
      const value=values[field.key];
      const update=(next:string)=>setValues(items=>({...items,[field.key]:next}));
      return <label key={field.key} className={styles.field}>{field.label}{field.optional?" (선택)":""}{["long","lines"].includes(field.type ?? "")?<textarea name={field.key} rows={field.type==="lines"?5:3} value={value} onChange={event=>update(event.target.value)} required={!field.optional} maxLength={30000}/>:<input name={field.key} type={field.type==="date"?"date":field.type==="url"?"url":"text"} value={value} onChange={event=>update(event.target.value)} required={!field.optional} maxLength={1000}/>} {field.type==="lines" && <span className={styles.help}>항목이나 문단마다 줄을 바꿔 입력하세요.</span>}</label>;
    })}</fieldset>
    {entry.kind==="wiki" && <fieldset disabled={pending}><legend>본문</legend>{sections.map((section,index)=><div className={styles.group} key={index}><label className={styles.field}>섹션 {index+1} 제목<input value={section.title} required maxLength={1000} onChange={event=>setSections(items=>items.map((item,i)=>i===index?{...item,title:event.target.value}:item))}/></label><label className={styles.field}>내용 (문단마다 줄바꿈)<textarea rows={6} value={section.body} required maxLength={30000} onChange={event=>setSections(items=>items.map((item,i)=>i===index?{...item,body:event.target.value}:item))}/></label><div className={styles.controls}><button type="button" className={common.button} disabled={index===0} onClick={()=>{setSections(move(sections,index,-1));setDirty(true);}}>위로</button><button type="button" className={common.button} disabled={index===sections.length-1} onClick={()=>{setSections(move(sections,index,1));setDirty(true);}}>아래로</button><button type="button" className={common.button} disabled={sections.length===1} onClick={()=>{setSections(sections.filter((_,i)=>i!==index));setDirty(true);}}>섹션 삭제</button></div></div>)}<button type="button" className={common.button} onClick={()=>{setSections([...sections,{title:"",body:""}]);setDirty(true);}}>섹션 추가</button></fieldset>}
    {entry.kind==="story" && <fieldset disabled={pending}><legend>본문</legend>{blocks.map((block,index)=><div key={block.id} className={styles.group}>{block.type==="image"?<p className={styles.help}>기존 사진: {block.image.alt} (사진 정보는 그대로 유지됩니다.)</p>:<><label className={styles.field}>내용 종류<select value={block.type} onChange={event=>setBlocks(items=>items.map(item=>item.id===block.id?{...block,type:event.target.value as "paragraph"|"heading"}:item))}><option value="paragraph">문단</option><option value="heading">소제목</option></select></label><label className={styles.field}>{index+1}. {block.type==="heading"?"소제목":"문단"}<textarea rows={block.type==="heading"?2:5} required value={block.text} maxLength={30000} onChange={event=>setBlocks(items=>items.map(item=>item.id===block.id?{...block,text:event.target.value}:item))}/></label></>}<div className={styles.controls}><button type="button" className={common.button} disabled={index===0} onClick={()=>{setBlocks(move(blocks,index,-1));setDirty(true);}}>위로</button><button type="button" className={common.button} disabled={index===blocks.length-1} onClick={()=>{setBlocks(move(blocks,index,1));setDirty(true);}}>아래로</button>{block.type!=="image" && <button type="button" className={common.button} disabled={blocks.length===1} onClick={()=>{setBlocks(blocks.filter(item=>item.id!==block.id));setDirty(true);}}>문단 삭제</button>}</div></div>)}<button type="button" className={common.button} onClick={()=>{setBlocks([...blocks,{id:crypto.randomUUID(),type:"paragraph",text:""}]);setDirty(true);}}>문단 추가</button></fieldset>}
    <fieldset disabled={pending}><legend>공개 설정</legend>{entry.kind!=="home" && <><label className={styles.field}>공개 상태<select name="status" value={status} onChange={event=>setStatus(event.target.value as "draft"|"published")}><option value="draft">임시 저장 (방문자에게 보이지 않음)</option><option value="published">공개</option></select></label><label className={styles.check}><input type="checkbox" name="isExample" checked={example} onChange={event=>setExample(event.target.checked)}/>화면 예시용 콘텐츠입니다.</label></>}{entry.kind==="home" && <p className={styles.help}>홈 소개는 저장하면 바로 공개됩니다.</p>}{entry.kind==="testimonial" && <label className={styles.check}><input type="checkbox" name="consent" checked={consent} onChange={event=>setConsent(event.target.checked)}/>참가자에게 이 내용의 공개 동의를 받았습니다.</label>}<label className={styles.field}>표시 순서 (작은 숫자가 먼저 표시됨)<input type="number" name="order" min={-100000} max={100000} step={1} value={order} onChange={event=>setOrder(event.target.value)} required/></label><div className={styles.controls}><button className={`${common.button} ${common.primary}`} disabled={pending}>{pending?"저장 중…":"저장"}</button><Link href={`/admin/content?kind=${entry.kind}`} onClick={confirmLeave}>목록으로</Link></div></fieldset>
    <p role={state.message&&!state.saved?"alert":"status"} aria-live="polite" className={state.message?styles.result:undefined}>{state.message}{state.saved && <> <Link href={`/admin/content?kind=${entry.kind}&saved=1`}>목록 확인</Link></>}</p>
  </form>;
}
