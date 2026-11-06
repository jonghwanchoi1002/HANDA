"use client";
import { prepareImageUpload } from "@/lib/content/prepare-image";
import { MAX_SOURCE_IMAGE_BYTES } from "@/lib/content/image-limits";
import { useState } from "react";
import Image from "next/image";
import type { ContentKind, ContentMap } from "@/lib/content/schema";
import common from "@/app/login/auth.module.css";
import styles from "@/app/admin/content/content.module.css";
export type Photo=NonNullable<ContentMap["testimonial"]["photo"]>;
export default function PhotoPicker({kind,contentKey,photos,onChange,enabled,disabled,max=10,onBusy}:{kind:ContentKind;contentKey:string;photos:Photo[];onChange:(photos:Photo[])=>void;enabled:boolean;disabled:boolean;max?:number;onBusy:(busy:boolean)=>void}) {
  const [alt,setAlt]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [phase,setPhase]=useState("");
  return <div className={styles.photoPicker}>
    <div className={styles.photoGrid}>{photos.map(photo=><figure key={photo.url}><Image src={photo.url} alt={photo.alt} width={photo.width} height={photo.height} unoptimized/><figcaption>{photo.alt}</figcaption><button type="button" disabled={busy||disabled} className={common.button} onClick={()=>onChange(photos.filter(item=>item.url!==photo.url))}>사진 제거</button></figure>)}</div>
    {!enabled && <p className={styles.help}>사진 첨부를 준비 중입니다. 글 작성과 수정은 계속할 수 있습니다.</p>}
    {photos.length<max && <><label className={styles.field}>사진 설명<input value={alt} maxLength={300} disabled={!enabled||busy||disabled} placeholder="사진에 담긴 내용을 설명해 주세요" onChange={event=>setAlt(event.target.value)}/></label><label className={styles.field}>사진 선택<input type="file" accept="image/jpeg,image/png,image/webp" disabled={!enabled||busy||disabled||!alt.trim()} onChange={async event=>{
      const input=event.currentTarget;const file=input.files?.[0];if(!file)return;
      if(file.size>MAX_SOURCE_IMAGE_BYTES){setError("사진은 한 장에 15MB 이하로 첨부해 주세요.");input.value="";return;}
      setError("");setBusy(true);setPhase("사진을 준비하고 있습니다…");onBusy(true);
      try{const prepared=await prepareImageUpload(file);setPhase("사진을 첨부하고 있습니다…");const form=new FormData();form.set("file",prepared);form.set("kind",kind);form.set("key",contentKey);form.set("alt",alt.trim());const response=await fetch("/api/images",{method:"POST",body:form});const result=await response.json();if(!response.ok)throw new Error(result.message||"사진을 첨부하지 못했습니다.");onChange([...photos,result]);setAlt("");}
      catch(error){setError(error instanceof Error?error.message:"사진을 첨부하지 못했습니다.");}
      finally{setBusy(false);onBusy(false);input.value="";}
    }}/></label></>}
    <p className={styles.help}>{busy?phase:"JPG · PNG · WebP, 원본 한 장에 15MB 이하. 첨부할 때 사진을 자동 최적화합니다. 사진 첨부 후 글을 저장해 주세요."}</p>
    {error&&<p role="alert">{error}</p>}
  </div>;
}
