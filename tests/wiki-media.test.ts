import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { Pool } from "pg";
import sharp from "sharp";
import { readPublishedContent } from "../src/lib/content/repository";
import { saveManagedContent } from "../src/lib/content/management";
import { uploadImage, readImage, normalizeImage, type ImageStore, MAX_IMAGE_BYTES } from "../src/lib/content/media";

async function setup(){
 const db=new PGlite();for(const file of ["001_content.sql","002_member_auth.sql","003_member_management.sql","004_content_management.sql","005_member_wiki_media.sql","006_wiki_publication_review.sql"])await db.exec(await readFile(new URL(`../database/migrations/${file}`,import.meta.url),"utf8"));
 const socket=new PGLiteSocketServer({db,host:"127.0.0.1",port:55448,maxConnections:10});await socket.start();
 const pool=new Pool({connectionString:"postgresql://postgres@127.0.0.1:55448/postgres",max:3});
 for(const [id,role,status] of [["admin","admin","approved"],["writer","member","approved"],["reader","member","approved"],["pending","member","pending"]])await pool.query(`INSERT INTO handa_auth_user(id,name,email,role,approval_status,"emailVerified") VALUES($1,$1,$2,$3,$4,true)`,[id,`${id}@example.test`,role,status]);
 const files=new Map<string,Buffer>();let reads=0;
 const store:ImageStore={async put(path,bytes){files.set(path,bytes);return path;},async remove(path){files.delete(path);},async get(path){reads++;const bytes=files.get(path);return bytes?new ReadableStream({start(controller){controller.enqueue(bytes);controller.close();}}):null;}};
 const bytes=await sharp({create:{width:100,height:80,channels:3,background:"#abcdef"}}).png().toBuffer();
 const viewer=(id:string)=>({id,role:id==="admin"?"admin":"member",approvalStatus:"approved",emailVerified:true});
 return {pool,store,bytes,files,viewer,reads:()=>reads,close:async()=>{await pool.end();await socket.stop();await db.close();}};
}
const wiki=(key:string)=>({kind:"wiki",key,revision:0,status:"draft",consent:false,order:0,payload:{slug:key,title:"회원 작성 글",summary:"요약",category:"창업",isExample:false,sections:[{title:"경험",paragraphs:["내용"]}]}});

test("approved members can create and edit only their wiki; admin scope and ownership stay enforced",async()=>{
 const c=await setup();try{
  await assert.rejects(saveManagedContent(c.pool,"pending",wiki("pending"),{wikiMember:true}),/권한/);
  await assert.rejects(saveManagedContent(c.pool,"writer",wiki("member-in-admin")),/권한/);
  await saveManagedContent(c.pool,"writer",wiki("owned"),{wikiMember:true});
  assert.equal((await c.pool.query("SELECT author_id FROM handa_content WHERE content_key='owned'")).rows[0].author_id,"writer");
  await assert.rejects(saveManagedContent(c.pool,"reader",{...wiki("owned"),revision:1},{wikiMember:true}),/본인이 작성/);
  await assert.rejects(saveManagedContent(c.pool,"writer",{...wiki("owned"),revision:1,status:"published"},{wikiMember:true}),/관리자만/);
  await saveManagedContent(c.pool,"writer",{...wiki("owned"),revision:1,status:"pending"},{wikiMember:true});
  const published=()=>readPublishedContent((sql,values)=>c.pool.query(sql,values),"wiki");
  assert.equal((await published()).length,0);
  await saveManagedContent(c.pool,"admin",{...wiki("owned"),revision:2,status:"published"});
  assert.equal((await published()).length,1);
  await assert.rejects(saveManagedContent(c.pool,"writer",{...wiki("owned"),revision:3,status:"published"},{wikiMember:true}),/관리자만/);
  await saveManagedContent(c.pool,"writer",{...wiki("owned"),revision:3,status:"pending",payload:{...wiki("owned").payload,title:"수정 후 재승인 필요"}},{wikiMember:true});
  assert.equal((await published()).length,0);
  assert.equal((await c.pool.query("SELECT author_id FROM handa_content WHERE content_key='owned'")).rows[0].author_id,"writer");
  const member={kind:"member",key:"profile",revision:0,status:"draft",consent:false,order:0,payload:{slug:"profile",name:"이름",field:"창업",role:"대표",summary:"소개",introduction:["소개"],interests:[],website:null,photoUrl:null,isExample:false}};
  await assert.rejects(saveManagedContent(c.pool,"writer",member,{wikiMember:true}),/권한/);
  await c.pool.query("UPDATE handa_auth_user SET approval_status='rejected' WHERE id='writer'");
  await assert.rejects(saveManagedContent(c.pool,"writer",{...wiki("owned"),revision:4},{wikiMember:true}),/권한/);
 }finally{await c.close();}
});

test("private wiki images require current membership; drafts and attachments cannot cross authors or articles",async()=>{
 const c=await setup();try{
  const photo=await uploadImage(c.pool,c.store,"writer",{kind:"wiki",key:"photos",alt:"테스트 사진",bytes:c.bytes});const id=photo.url.split("/").at(-1)!;
  const input={...wiki("photos"),payload:{...wiki("photos").payload,photos:[photo]}};
  const stored=await readImage(c.pool,c.store,id,c.viewer("writer"));assert.ok((await new Response(stored).arrayBuffer()).byteLength>0);
  const before=c.reads();await assert.rejects(readImage(c.pool,c.store,id,null));await assert.rejects(readImage(c.pool,c.store,id,c.viewer("reader")));assert.equal(c.reads(),before);
  await saveManagedContent(c.pool,"writer",input,{wikiMember:true});
  await assert.rejects(readImage(c.pool,c.store,id,c.viewer("reader")));
  await saveManagedContent(c.pool,"writer",{...input,revision:1,status:"pending"},{wikiMember:true});
  await assert.rejects(readImage(c.pool,c.store,id,c.viewer("reader")));
  await saveManagedContent(c.pool,"admin",{...input,revision:2,status:"published"});
  assert.ok(await readImage(c.pool,c.store,id,c.viewer("reader")));await assert.rejects(readImage(c.pool,c.store,id,null));
  await assert.rejects(readImage(c.pool,c.store,id,{...c.viewer("reader"),approvalStatus:"rejected"}));
  await assert.rejects(saveManagedContent(c.pool,"writer",{...wiki("other"),payload:{...wiki("other").payload,photos:[photo]}},{wikiMember:true}),/이 글에 첨부/);
  await assert.rejects(uploadImage(c.pool,c.store,"reader",{kind:"wiki",key:"photos",alt:"위조",bytes:c.bytes}),/본인이 작성/);
  await saveManagedContent(c.pool,"writer",{...input,revision:3},{wikiMember:true});await assert.rejects(readImage(c.pool,c.store,id,c.viewer("reader")));
 }finally{await c.close();}
});

test("public images follow publication and consent; invalid uploads and quotas fail before storage",async()=>{
 const c=await setup();try{
  const photo=await uploadImage(c.pool,c.store,"admin",{kind:"testimonial",key:"public",alt:"참가자 사진",bytes:c.bytes});const id=photo.url.split("/").at(-1)!;
  const input={kind:"testimonial",key:"public",revision:0,status:"published",consent:true,order:0,payload:{id:"public",name:"참가자",introduction:"소개",quote:"내용",topic:"배움",photo,isExample:false}};
  await saveManagedContent(c.pool,"admin",input);assert.ok(await readImage(c.pool,c.store,id,null));
  await saveManagedContent(c.pool,"admin",{...input,revision:1,status:"draft",consent:false});await assert.rejects(readImage(c.pool,c.store,id,null));
  await assert.rejects(uploadImage(c.pool,c.store,"writer",{kind:"story",key:"forbidden",alt:"사진",bytes:c.bytes}),/권한/);
  await assert.rejects(normalizeImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')),/JPG/);
  await assert.rejects(normalizeImage(Buffer.alloc(MAX_IMAGE_BYTES+1)),/3MB/);
  await assert.rejects(normalizeImage(Buffer.from("not an image")),/JPG/);
  const normalized=await normalizeImage(c.bytes);assert.equal((await sharp(normalized.bytes).metadata()).format,"webp");assert.equal(normalized.width,100);
  await c.pool.query("INSERT INTO handa_media(id,uploader_id,kind,content_key,blob_pathname) SELECT gen_random_uuid(),'writer','wiki','quota','quota-'||n FROM generate_series(1,30) n");
  await assert.rejects(uploadImage(c.pool,c.store,"writer",{kind:"wiki",key:"quota",alt:"사진",bytes:c.bytes}),/잠시 후/);
  assert.equal(c.files.size,1);
 }finally{await c.close();}
});
