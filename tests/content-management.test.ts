import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { Pool } from "pg";
import { saveManagedContent } from "../src/lib/content/management";
import { readPublishedContent } from "../src/lib/content/repository";
import { getInitialContent } from "../src/lib/content/initial";

async function setup() {
  const db=new PGlite();
  for(const name of ["001_content.sql","002_member_auth.sql","003_member_management.sql","004_content_management.sql"]) await db.exec(await readFile(new URL(`../database/migrations/${name}`,import.meta.url),"utf8"));
  const server=new PGLiteSocketServer({db,port:55447,host:"127.0.0.1",maxConnections:10});await server.start();
  const pool=new Pool({connectionString:"postgresql://postgres@127.0.0.1:55447/postgres",max:3});
  for(const [id,role,status,verified] of [["admin","admin","approved",true],["member","member","approved",true],["pending","admin","pending",true],["unverified","admin","approved",false]]) await pool.query(`INSERT INTO handa_auth_user(id,name,email,role,approval_status,"emailVerified") VALUES($1,$1,$2,$3,$4,$5)`,[id,`${id}@example.test`,role,status,verified]);
  const query=(sql:string,values:unknown[])=>pool.query(sql,values);
  return {pool,query,close:async()=>{await pool.end();await server.stop();await db.close();}};
}
const wiki={kind:"wiki",key:"new-wiki",revision:0,status:"draft",consent:false,order:2,payload:{slug:"new-wiki",title:"새 위키",category:"창업",summary:"요약",isExample:false,sections:[{title:"첫 단계",paragraphs:["내용"]}]}};

test("only current approved verified admins can write; drafts stay private and publishing/unpublishing takes effect",async()=>{
  const c=await setup();try{
    for(const actor of ["member","pending","unverified","missing"])await assert.rejects(saveManagedContent(c.pool,actor,wiki),/관리자 권한/);
    await saveManagedContent(c.pool,"admin",wiki);
    assert.equal((await readPublishedContent(c.query,"wiki")).length,0);
    await saveManagedContent(c.pool,"admin",{...wiki,revision:1,status:"published"});
    assert.equal((await readPublishedContent(c.query,"wiki"))[0].title,"새 위키");
    await c.pool.query("UPDATE handa_auth_user SET role='member' WHERE id='admin'");
    await assert.rejects(saveManagedContent(c.pool,"admin",{...wiki,revision:2}),/관리자 권한/);
    await c.pool.query("UPDATE handa_auth_user SET role='admin' WHERE id='admin'");
    await saveManagedContent(c.pool,"admin",{...wiki,revision:2});
    assert.equal((await readPublishedContent(c.query,"wiki")).length,0);
    assert.equal((await c.pool.query("SELECT count(*)::int AS count FROM handa_content_audit WHERE actor_id='admin'")).rows[0].count,3);
  }finally{await c.close();}
});

test("concurrent updates preserve the winning version and failed validation leaves content and audit unchanged",async()=>{
  const c=await setup();try{
    await saveManagedContent(c.pool,"admin",wiki);
    const results=await Promise.allSettled(["수정A","수정B"].map(title=>saveManagedContent(c.pool,"admin",{...wiki,revision:1,payload:{...wiki.payload,title}})));
    assert.equal(results.filter(result=>result.status==="fulfilled").length,1);
    assert.match(String((results.find(result=>result.status==="rejected") as PromiseRejectedResult).reason),/다른 관리자/);
    await assert.rejects(saveManagedContent(c.pool,"admin",{...wiki,key:"invalid-key"}),/글 주소/);
    await assert.rejects(saveManagedContent(c.pool,"admin",{...wiki,payload:{...wiki.payload,title:""}}));
    assert.equal((await c.pool.query("SELECT count(*)::int AS count FROM handa_content_audit")).rows[0].count,2);
    assert.equal((await c.pool.query("SELECT revision FROM handa_content")).rows[0].revision,2);
  }finally{await c.close();}
});

test("all content types round-trip including images; testimonials require consent and homepage stays published",async()=>{
  const c=await setup();try{
    for(const entry of getInitialContent()) {
      await saveManagedContent(c.pool,"admin",{...entry,revision:0,status:entry.kind==="home"?"published":"draft"});
      const stored=(await c.pool.query("SELECT payload FROM handa_content WHERE kind=$1 AND content_key=$2",[entry.kind,entry.key])).rows[0].payload;
      if(entry.kind==="story")assert.deepEqual(stored.cover,(entry.payload as {cover:unknown}).cover);
    }
    const testimonial={kind:"testimonial",key:"real-person",revision:0,status:"published",consent:false,order:0,payload:{id:"real-person",name:"참가자",introduction:"창업자",quote:"좋아요",topic:"배움",photo:null,isExample:false}};
    await assert.rejects(saveManagedContent(c.pool,"admin",testimonial),/공개 동의/);
    await saveManagedContent(c.pool,"admin",{...testimonial,consent:true});
    assert.equal((await readPublishedContent(c.query,"testimonial")).length,1);
    const home=getInitialContent().find(entry=>entry.kind==="home")!;
    await assert.rejects(saveManagedContent(c.pool,"admin",{...home,revision:1,status:"draft"}),/공개 상태/);
    const history=(await c.pool.query("SELECT previous_value,new_value FROM handa_content_audit WHERE kind='home'")).rows[0];
    assert.equal(history.previous_value,null);assert.equal(history.new_value.revision,1);
  }finally{await c.close();}
});
