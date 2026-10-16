import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { setTimeout as delay } from "node:timers/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { Pool } from "pg";
import { createHandaAuth, type AuthMail } from "../src/lib/auth/config";
import { getInitialContent } from "../src/lib/content/initial";
import { parseContent } from "../src/lib/content/schema";

test("running Next.js protects wiki HTML/RSC, reads current approval and keeps other pages public", {timeout:60000}, async () => {
  const db=new PGlite();
  for (const name of ["001_content.sql","002_member_auth.sql","003_member_management.sql","004_content_management.sql"]) await db.exec(await readFile(new URL(`../database/migrations/${name}`,import.meta.url),"utf8"));
  const socket=new PGLiteSocketServer({db,host:"127.0.0.1",port:55445,maxConnections:20});await socket.start();
  const databaseURL="postgresql://postgres@127.0.0.1:55445/postgres";
  const pool=new Pool({connectionString:databaseURL,max:1});
  const baseURL="http://localhost:3900";
  const secret=randomBytes(32).toString("base64");
  const mails:AuthMail[]=[];
  const auth=createHandaAuth({database:pool,baseURL,secret,sendMail:async message=>{mails.push(message)}});
  const require=createRequire(import.meta.url);
  const child=spawn(process.execPath,[require.resolve("next/dist/bin/next"),"start","--hostname","127.0.0.1","--port","3900"],{env:{...process.env,CONTENT_SOURCE:"database",DATABASE_URL:databaseURL,BETTER_AUTH_URL:baseURL,BETTER_AUTH_SECRET:secret,RESEND_API_KEY:"",MAIL_FROM:"",GOOGLE_CLIENT_ID:"",GOOGLE_CLIENT_SECRET:""},stdio:["ignore","pipe","pipe"]});
  let logs="";child.stdout.on("data",chunk=>{logs+=chunk});child.stderr.on("data",chunk=>{logs+=chunk});
  try {
    for (const entry of getInitialContent()) {
      const payload=parseContent(entry.kind,entry.payload);
      await pool.query("INSERT INTO handa_content(kind,content_key,payload,status,is_example,publication_consent,sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7)",[entry.kind,entry.key,payload,entry.status,"isExample" in payload&&payload.isExample,entry.consent,entry.order]);
    }
    const privateArticle={slug:"private-test",title:"PRIVATE_TITLE_93847",summary:"PRIVATE_SUMMARY_93847",category:"회원",isExample:false,sections:[{title:"비공개 내용",paragraphs:["PRIVATE_BODY_93847"]}]};
    await pool.query("INSERT INTO handa_content(kind,content_key,payload,status) VALUES ('wiki','private-test',$1,'published')",[privateArticle]);
    let ready=false;
    for(let attempt=0;attempt<80;attempt++) {try {await fetch(baseURL+"/login");ready=true;break;} catch {if(child.exitCode!==null)break;await delay(100);}}
    assert.ok(ready,`Next.js startup failed: ${logs.slice(-1000)}`);
    const privateValues=[privateArticle.title,privateArticle.summary,privateArticle.sections[0].paragraphs[0]];
    async function checkDenied(path:string,cookie="") {
      for(const rsc of [false,true]) {
        const response=await fetch(baseURL+path,{redirect:"manual",headers:{...(cookie?{cookie}:{}),...(rsc?{RSC:"1"}:{})}});
        const body=await response.text();for(const text of privateValues)assert.ok(!body.includes(text),`${path} exposed ${text}`);
        assert.ok(response.status>=300||body.includes("NEXT_REDIRECT"),`${path} should redirect unauthorised readers`);
      }
    }
    await checkDenied("/wiki");await checkDenied("/wiki/private-test");await checkDenied("/admin");await checkDenied("/admin/members");await checkDenied("/admin/content");await checkDenied("/admin/content/wiki/new");
    const homepage=await(await fetch(baseURL)).text();for(const text of privateValues)assert.ok(!homepage.includes(text));
    assert.ok(homepage.includes(">로그인 / 회원가입</a>"));
    assert.ok(!homepage.includes(">회원 관리</a>"));
    for(const path of ["/members","/stories","/testimonials"])assert.equal((await fetch(baseURL+path)).status,200);
    const email="access-test@example.test",password="access-test-password-12345";
    const call=(path:string,body?:unknown)=>auth.handler(new Request(baseURL+"/api/auth"+path,{method:body?"POST":"GET",headers:{origin:baseURL,"content-type":"application/json","x-forwarded-for":"192.0.2.50"},body:body?JSON.stringify(body):undefined}));
    await call("/sign-up/email",{name:"접근 검사 회원",email,password});
    await auth.handler(new Request(mails.at(-1)!.text.match(/https?:\/\/\S+/)![0]));
    const signedIn=await call("/sign-in/email",{email,password});assert.equal(signedIn.status,200);
    const cookie=signedIn.headers.getSetCookie().map(value=>value.split(";")[0]).join("; ");
    await checkDenied("/wiki/private-test",cookie);await checkDenied("/admin",cookie);await checkDenied("/admin/content",cookie);await checkDenied("/admin/content/wiki/private-test",cookie);
    for (const path of ["/", "/members", "/stories", "/testimonials"]) {
      const body = await (await fetch(baseURL + path, { headers: { cookie } })).text();
      assert.ok(body.includes(">내 계정</a>"), `${path} should show account navigation after login`);
      assert.ok(!body.includes(">로그인 / 회원가입</a>"));
      assert.ok(!body.includes(">회원 관리</a>"));
    }
    await pool.query("UPDATE handa_auth_user SET approval_status='approved' WHERE email=$1",[email]);
    const allowed=await fetch(baseURL+"/wiki/private-test",{headers:{cookie}});assert.ok((await allowed.text()).includes(privateArticle.sections[0].paragraphs[0]));
    assert.ok(!allowed.headers.get("cache-control")?.includes("public"));
    await checkDenied("/admin",cookie);
    await pool.query("UPDATE handa_auth_user SET approval_status='rejected' WHERE email=$1",[email]);await checkDenied("/wiki/private-test",cookie);
    await pool.query("UPDATE handa_auth_user SET approval_status='approved',role='admin' WHERE email=$1",[email]);
    const adminRedirect=await fetch(baseURL+"/admin",{headers:{cookie},redirect:"manual"});
    assert.ok(adminRedirect.status>=300 || (await adminRedirect.text()).includes("/admin/members"));
    const loginRedirect=await fetch(baseURL+"/login",{headers:{cookie},redirect:"manual"});
    const loginBody=await loginRedirect.text();
    assert.ok(loginRedirect.headers.get("location")==="/" || loginBody.includes('NEXT_REDIRECT;replace;/;'));
    const adminHome=await(await fetch(baseURL,{headers:{cookie}})).text();
    assert.ok(adminHome.includes(">회원 관리</a>"));
    const account=await(await fetch(baseURL+"/account",{headers:{cookie}})).text();
    assert.ok(account.includes('aria-label="계정 메뉴"'));
    assert.ok(account.includes(">회원 관리</a>"));
    const editor=await fetch(baseURL+"/admin/content/wiki/private-test",{headers:{cookie}});assert.ok((await editor.text()).includes("PRIVATE_TITLE_93847"));
    const admin=await fetch(baseURL+"/admin/members",{headers:{cookie}});const adminBody=await admin.text();assert.ok(adminBody.includes("회원 관리"));
    assert.ok(!adminBody.includes('>비즈니스 위키</a>'));
  } finally {
    child.kill("SIGTERM");
    for(let attempt=0;attempt<30&&child.exitCode===null;attempt++)await delay(100);
    if(child.exitCode===null)child.kill("SIGKILL");
    await pool.end();await socket.stop();await db.close();
  }
});
