import { MAX_UPLOAD_IMAGE_BYTES, MAX_IMAGE_EDGE_LENGTH } from "./image-limits";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { Pool } from "pg";
import { canManageMembers, canReadWiki } from "../auth/permissions";
import { imageURLs, canReadMedia, type MediaViewer } from "./media-access";

export const MAX_IMAGE_BYTES=MAX_UPLOAD_IMAGE_BYTES;
export class MediaError extends Error { constructor(message:string,public status=400){super(message);} }
export type ImageStore={put:(pathname:string,body:Buffer)=>Promise<string>;remove:(pathname:string)=>Promise<void>;get:(pathname:string)=>Promise<ReadableStream<Uint8Array>|null>};
export async function normalizeImage(bytes:Buffer) {
  if(!bytes.length||bytes.length>MAX_IMAGE_BYTES)throw new MediaError("사진은 한 장에 3MB 이하로 첨부해 주세요.",413);
  try {
    const image=sharp(bytes,{limitInputPixels:32000000,animated:false});
    const metadata=await image.metadata();
    if(!["jpeg","png","webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1)>1)throw new Error();
    // 원본 위치 정보·메타데이터를 제거하고 실제 이미지로 다시 인코딩합니다.
    const result=await image.rotate().resize({width:MAX_IMAGE_EDGE_LENGTH,height:MAX_IMAGE_EDGE_LENGTH,fit:"inside",withoutEnlargement:true}).webp({quality:85}).toBuffer({resolveWithObject:true});
    return {bytes:result.data,width:result.info.width,height:result.info.height};
  }catch {throw new MediaError("JPG, PNG, WebP 사진 파일을 선택해 주세요.");}
}
export async function uploadImage(db:Pool,store:ImageStore,actorId:string,input:{kind:string;key:string;alt:string;bytes:Buffer}) {
  if(!["wiki","member","story","testimonial"].includes(input.kind)|| !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.key)||input.key.length>100||!input.alt.trim()||input.alt.length>300)throw new MediaError("사진 설명과 첨부할 글을 확인해 주세요.");
  const image=await normalizeImage(input.bytes);
  const client=await db.connect();let pathname:string|undefined;
  try {
    await client.query("BEGIN");await client.query("SELECT pg_advisory_xact_lock(720241017)");
    const actor=(await client.query(`SELECT id,role,approval_status AS "approvalStatus","emailVerified" FROM handa_auth_user WHERE id=$1 FOR SHARE`,[actorId])).rows[0];
    if(!canReadWiki(actor ?? null)||(!canManageMembers(actor)&&input.kind!=="wiki"))throw new MediaError("사진을 첨부할 권한이 없습니다.",403);
    const existing=(await client.query("SELECT author_id FROM handa_content WHERE kind=$1 AND content_key=$2",[input.kind,input.key])).rows[0];
    if(existing&&!canManageMembers(actor)&&existing.author_id!==actorId)throw new MediaError("본인이 작성한 글에만 사진을 첨부할 수 있습니다.",403);
    const reserved=(await client.query("SELECT uploader_id FROM handa_media WHERE kind=$1 AND content_key=$2 LIMIT 1",[input.kind,input.key])).rows[0];
    if(!existing&&reserved&&!canManageMembers(actor)&&reserved.uploader_id!==actorId)throw new MediaError("첨부할 글을 확인해 주세요.",403);
    const quota=(await client.query("SELECT count(*)::int AS count FROM handa_media WHERE uploader_id=$1 AND created_at>now()-interval '1 hour'",[actorId])).rows[0].count;
    if(quota>=30)throw new MediaError("사진 첨부가 많습니다. 잠시 후 다시 시도해 주세요.",429);
    const id=randomUUID();pathname=await store.put(`handa/${input.kind}/${id}.webp`,image.bytes);
    await client.query("INSERT INTO handa_media(id,uploader_id,kind,content_key,blob_pathname) VALUES($1,$2,$3,$4,$5)",[id,actorId,input.kind,input.key,pathname]);
    await client.query("COMMIT");
    return {url:`/api/images/${id}`,alt:input.alt.trim(),width:image.width,height:image.height};
  } catch(error) {
    await client.query("ROLLBACK");
    if(pathname)try {await store.remove(pathname);}catch{console.error("Uncommitted image cleanup failed.");}
    throw error;
  }finally{client.release();}
}
export async function readImage(db:Pool,store:ImageStore,id:string,viewer:MediaViewer|null) {
  if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id))throw new MediaError("사진을 찾을 수 없습니다.",404);
  const media=(await db.query("SELECT * FROM handa_media WHERE id=$1",[id])).rows[0];
  if(!media)throw new MediaError("사진을 찾을 수 없습니다.",404);
  const content=(await db.query("SELECT payload,status,author_id,is_example,publication_consent FROM handa_content WHERE kind=$1 AND content_key=$2",[media.kind,media.content_key])).rows[0];
  const attached=content&&imageURLs(content.payload).includes(`/api/images/${id}`);
  if(!canReadMedia(viewer,media,attached?content:undefined))throw new MediaError("사진을 찾을 수 없습니다.",404);
  const stream=await store.get(media.blob_pathname);if(!stream)throw new MediaError("사진을 찾을 수 없습니다.",404);
  return stream;
}
