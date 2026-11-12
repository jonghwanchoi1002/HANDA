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
  for(const name of ["001_content.sql","002_member_auth.sql","003_member_management.sql","004_content_management.sql","005_member_wiki_media.sql","006_wiki_publication_review.sql","011_editable_introduction_pages.sql"]) await db.exec(await readFile(new URL(`../database/migrations/${name}`,import.meta.url),"utf8"));
  const server=new PGLiteSocketServer({db,port:55447,host:"127.0.0.1",maxConnections:10});await server.start();
  const pool=new Pool({connectionString:"postgresql://postgres@127.0.0.1:55447/postgres",max:3});
  for(const [id,role,status,verified] of [["admin","admin","approved",true],["member","member","approved",true],["pending","admin","pending",true],["unverified","admin","approved",false]]) await pool.query(`INSERT INTO handa_auth_user(id,name,email,role,approval_status,"emailVerified") VALUES($1,$1,$2,$3,$4,$5)`,[id,`${id}@example.test`,role,status,verified]);
  const query=(sql:string,values:unknown[])=>pool.query(sql,values);
  return {pool,query,close:async()=>{await pool.end();await server.stop();await db.close();}};
}
const wiki={kind:"wiki",key:"new-wiki",revision:0,status:"draft",consent:false,order:2,payload:{slug:"new-wiki",title:"새 위키",category:"창업",summary:"요약",isExample:false,sections:[{title:"첫 단계",paragraphs:["내용"]}]}};

test("only current approved verified admins can write; drafts stay private and publishing/unpublishing takes effect",async()=>{
  const c=await setup();try{
    for(const actor of ["member","pending","unverified","missing"])await assert.rejects(saveManagedContent(c.pool,actor,wiki),/권한/);
    await saveManagedContent(c.pool,"admin",wiki);
    assert.equal((await readPublishedContent(c.query,"wiki")).length,0);
    await saveManagedContent(c.pool,"admin",{...wiki,revision:1,status:"published"});
    assert.equal((await readPublishedContent(c.query,"wiki"))[0].title,"새 위키");
    await c.pool.query("UPDATE handa_auth_user SET role='member' WHERE id='admin'");
    await assert.rejects(saveManagedContent(c.pool,"admin",{...wiki,revision:2}),/권한/);
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
    assert.equal((await c.pool.query("SELECT revision FROM handa_content WHERE kind='wiki' AND content_key='new-wiki'")).rows[0].revision,2);
  }finally{await c.close();}
});

test("all content types round-trip including images; testimonials require consent and homepage stays published",async()=>{
  const c=await setup();try{
    for(const entry of getInitialContent()) {
      const revision=(await c.pool.query("SELECT revision FROM handa_content WHERE kind=$1 AND content_key=$2",[entry.kind,entry.key])).rows[0]?.revision??0;
      await saveManagedContent(c.pool,"admin",{...entry,revision,status:entry.kind==="home"||entry.kind==="page"?"published":"draft"});
      const stored=(await c.pool.query("SELECT payload FROM handa_content WHERE kind=$1 AND content_key=$2",[entry.kind,entry.key])).rows[0].payload;
      if(entry.kind==="story")assert.deepEqual(stored.cover,(entry.payload as {cover:unknown}).cover);
    }
    const testimonial={kind:"testimonial",key:"real-person",revision:0,status:"published",consent:false,order:0,payload:{id:"real-person",name:"참가자",introduction:"창업자",quote:"좋아요",sections:[{title:"",paragraphs:["함께한 경험을 나눕니다."]}],topic:"배움",photo:null,isExample:false}};
    await assert.rejects(saveManagedContent(c.pool,"admin",testimonial),/공개 동의/);
    await saveManagedContent(c.pool,"admin",{...testimonial,consent:true});
    assert.equal((await readPublishedContent(c.query,"testimonial")).length,1);
    const home=getInitialContent().find(entry=>entry.kind==="home")!;
    await assert.rejects(saveManagedContent(c.pool,"admin",{...home,revision:1,status:"draft"}),/공개 상태/);
    const history=(await c.pool.query("SELECT previous_value,new_value FROM handa_content_audit WHERE kind='home'")).rows[0];
    assert.equal(history.previous_value,null);assert.equal(history.new_value.revision,1);
  }finally{await c.close();}
});

test("homepage design migrates only legacy copy and admins can edit every About item",async()=>{
  const c=await setup();try{
    const entry=getInitialContent().find(item=>item.kind==="home")!;
    const legacy={...(entry.payload as Record<string,unknown>),heroTitle:"시작하고,",heroSubtitle:"함께",heroHighlight:"성장합니다.",aboutTitle:["관리자가 작성한 소개"],aboutValue2Title:"관리자 맞춤 항목"};
    delete (legacy as Record<string,unknown>).aboutValue1Title;
    await c.pool.query("INSERT INTO handa_content(kind,content_key,payload,status) VALUES('home','homepage',$1,'published')",[legacy]);
    const migration=await readFile(new URL("../database/migrations/009_home_design_copy.sql",import.meta.url),"utf8");
    await c.pool.query(migration);
    const initial=(await readPublishedContent(c.query,"home"))[0];
    assert.equal(initial.heroTitle,"혼자 고민하던 일을,");
    assert.equal(initial.heroSubtitle,"함께 풀어가는");
    assert.deepEqual(initial.aboutTitle,["관리자가 작성한 소개"]);
    assert.equal(initial.aboutValue1Title,"사람과 연결되고");
    assert.equal(initial.aboutValue2Title,"관리자 맞춤 항목");
    const revision=(await c.pool.query("SELECT revision FROM handa_content WHERE kind='home'")).rows[0].revision;
    await c.pool.query(migration);
    assert.equal((await c.pool.query("SELECT revision FROM handa_content WHERE kind='home'")).rows[0].revision,revision);
    assert.equal((await c.pool.query("SELECT count(*)::int AS count FROM handa_content_audit WHERE kind='home'")).rows[0].count,1);
    const payload={...initial,aboutTitle:["바뀐 소개 제목"],aboutValue1Title:"바뀐 01 제목",aboutValue1Description:"바뀐 01 설명",aboutValue2Title:"바뀐 02 제목",aboutValue2Description:"바뀐 02 설명",aboutValue3Title:"바뀐 03 제목",aboutValue3Description:"바뀐 03 설명"};
    await assert.rejects(saveManagedContent(c.pool,"member",{...entry,payload,revision,status:"published"}),/권한/);
    await saveManagedContent(c.pool,"admin",{...entry,payload,revision,status:"published"});
    assert.deepEqual((await readPublishedContent(c.query,"home"))[0],payload);
    await assert.rejects(saveManagedContent(c.pool,"admin",{...entry,payload:{...payload,aboutValue1Title:""},revision:revision+1,status:"published"}));
  }finally{await c.close();}
});

test("reference hero migration replaces WIP copy once, preserves About edits, and remains editable",async()=>{
  const c=await setup();try{
    const home=getInitialContent().find(entry=>entry.kind==="home")!;
    const initial={...(home.payload as Record<string,unknown>),heroTitle:"WIP",heroSubtitle:"테스트",heroHighlight:"개발 중",heroDescription:["테스트 설명"],aboutTitle:["수정한 소개"],aboutValue1Title:"맞춤 항목"};
    await saveManagedContent(c.pool,"admin",{...home,payload:initial,revision:0,status:"published"});
    const migration=await readFile(new URL("../database/migrations/010_home_reference_hero_copy.sql",import.meta.url),"utf8");
    await c.pool.query(migration);
    const published=(await readPublishedContent(c.query,"home"))[0];
    assert.equal(published.heroTitle,"혼자 고민하던 일을,");assert.equal(published.heroSubtitle,"함께 풀어가는");assert.equal(published.heroHighlight,"곳.");
    assert.deepEqual(published.heroDescription,["낯선 환경에서 시작하는 창업. 경험을 나눌 동료가 있다면 달라집니다."]);
    assert.deepEqual(published.aboutTitle,["수정한 소개"]);assert.equal(published.aboutValue1Title,"맞춤 항목");
    const before=(await c.pool.query("SELECT revision FROM handa_content WHERE kind='home'")).rows[0].revision;
    await c.pool.query(migration);assert.equal((await c.pool.query("SELECT revision FROM handa_content WHERE kind='home'")).rows[0].revision,before);
    await saveManagedContent(c.pool,"admin",{...home,payload:{...published,heroTitle:"이후 관리자 수정"},revision:before,status:"published"});
    assert.equal((await readPublishedContent(c.query,"home"))[0].heroTitle,"이후 관리자 수정");
  }finally{await c.close();}
});

test("only admins edit fixed introduction pages; rich copy persists and seed never overwrites edits",async()=>{
 const c=await setup();try{
  const entry=getInitialContent().find(e=>e.kind==="page"&&e.key==="about")!;
  const initial=(await readPublishedContent(c.query,"page","about"))[0];
  const payload={...initial,heading:"관리자 수정",body:"새 소개 본문",richText:{body:{type:"doc",content:[{type:"paragraph",content:[{type:"text",text:"새 소개 본문",marks:[{type:"bold"}]}]}]}}};
  await assert.rejects(saveManagedContent(c.pool,"member",{...entry,payload,revision:1}),/권한/);
  await assert.rejects(saveManagedContent(c.pool,"member",{...entry,payload,revision:1},{wikiMember:true}),/권한/);
  await assert.rejects(saveManagedContent(c.pool,"admin",{...entry,payload,revision:1,status:"draft"}),/공개/);
  await saveManagedContent(c.pool,"admin",{...entry,payload,revision:1});
  assert.equal((await readPublishedContent(c.query,"page","about"))[0].body,"새 소개 본문");
  await c.pool.query("INSERT INTO handa_content(kind,content_key,payload,status) VALUES('page','about',$1,'published') ON CONFLICT(kind,content_key) DO NOTHING",[entry.payload]);
  assert.equal((await readPublishedContent(c.query,"page","about"))[0].heading,"관리자 수정");
  await assert.rejects(saveManagedContent(c.pool,"admin",{...entry,payload,revision:1}),/다른 관리자/);
 }finally{await c.close();}
});

test("testimonial sections are mandatory on save, preserve order and formatting, and keep admin/consent checks",async()=>{
 const c=await setup();try{
  const initial=getInitialContent().find(e=>e.kind==="testimonial")!;
  const base=initial.payload as Record<string,unknown>;
  const doc={type:"doc",content:[{type:"paragraph",content:[{type:"text",text:"경험과 인사이트",marks:[{type:"bold"}]}]}]};
  const payload={...base,id:"section-review",isExample:false,sections:[{number:"03",title:"도움이 된 부분",paragraphs:["경험과 인사이트"],highlight:true,bodyRichText:doc},{number:"",title:"",paragraphs:["하나의 본문으로도 작성합니다."],highlight:false}]};
  const entry={kind:"testimonial",key:"section-review",revision:0,status:"published",consent:true,order:0,payload};
  for(const sections of [undefined,[],[{title:"질문만 있음",paragraphs:[]}],[{title:"",paragraphs:["  "]}]])await assert.rejects(saveManagedContent(c.pool,"admin",{...entry,payload:{...payload,sections}}));
  await assert.rejects(saveManagedContent(c.pool,"admin",{...entry,payload:{...payload,sections:undefined,body:"예전 본문으로 필수 검증을 우회할 수 없음"}}));
  await assert.rejects(saveManagedContent(c.pool,"admin",{...entry,payload:{...payload,joinUrl:"javascript:alert(1)"}}));
  await assert.rejects(saveManagedContent(c.pool,"member",entry),/권한/);
  await assert.rejects(saveManagedContent(c.pool,"admin",{...entry,consent:false}),/공개 동의/);
  await saveManagedContent(c.pool,"admin",entry);
  const saved=(await readPublishedContent(c.query,"testimonial","section-review"))[0];
  assert.deepEqual(saved.sections,payload.sections);
  assert.equal(saved.joinUrl,"https://forms.gle/SXXxb8321efoPFta8");
  await saveManagedContent(c.pool,"admin",{...entry,revision:1,payload:{...payload,sections:[...payload.sections].reverse()}});
  assert.equal((await readPublishedContent(c.query,"testimonial","section-review"))[0].sections?.[0].number,"");
 }finally{await c.close();}
});

test("testimonial migration preserves legacy bodies and rich text, fills only empty examples, and is repeatable",async()=>{
 const c=await setup();try{
  const initial=getInitialContent().find(e=>e.kind==="testimonial")!.payload as Record<string,unknown>;
  const legacy={...initial,sections:undefined,body:"첫 문단\n\n둘째 문단",richText:{body:{type:"doc",content:[{type:"paragraph",content:[{type:"text",text:"첫 문단",marks:[{type:"bold"}]}]},{type:"paragraph"},{type:"paragraph",content:[{type:"text",text:"둘째 문단"}]}]}}};
  for(const [key,payload,example] of [["old-body",legacy,false],["empty-example",{...initial,sections:undefined},true],["old-empty-real",{...initial,sections:undefined},false],["already-edited",initial,true]] as const){
    await c.pool.query("INSERT INTO handa_content(kind,content_key,payload,status,is_example,publication_consent) VALUES('testimonial',$1,$2,'published',$3,true)",[key,{...payload,id:key,isExample:example},example]);
  }
  const sql=await readFile(new URL("../database/migrations/012_testimonial_sections.sql",import.meta.url),"utf8");await c.pool.query(sql);
  const body=(await readPublishedContent(c.query,"testimonial","old-body"))[0];
  assert.deepEqual(body.sections?.[0].paragraphs,["첫 문단","둘째 문단"]);assert.deepEqual(body.sections?.[0].bodyRichText,legacy.richText.body);
  assert.ok((await readPublishedContent(c.query,"testimonial","empty-example"))[0].sections?.[0].paragraphs.length);
  assert.equal((await readPublishedContent(c.query,"testimonial","old-empty-real"))[0].sections,undefined);
  assert.deepEqual((await readPublishedContent(c.query,"testimonial","already-edited"))[0].sections,initial.sections);
  const before=(await c.pool.query("SELECT content_key,payload,revision FROM handa_content WHERE kind='testimonial' ORDER BY content_key")).rows;
  await c.pool.query(sql);assert.deepEqual((await c.pool.query("SELECT content_key,payload,revision FROM handa_content WHERE kind='testimonial' ORDER BY content_key")).rows,before);
 }finally{await c.close();}
});
