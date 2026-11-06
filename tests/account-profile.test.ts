import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { Pool } from "pg";
import { createHandaAuth, type AuthMail } from "../src/lib/auth/config";
import { getAccountProfile, getApprovalNotice, acknowledgeApprovalNotice, updateProfileVisibility } from "../src/lib/auth/account-profile";
import { canViewMemberProfile } from "../src/lib/auth/profile-visibility";
import { changeMembershipStatus } from "../src/lib/auth/membership";

async function setup(){
 const db=new PGlite();for(const file of ["002_member_auth.sql","003_member_management.sql","007_account_profile_notice.sql","008_profile_visibility.sql"])await db.exec(await readFile(new URL(`../database/migrations/${file}`,import.meta.url),"utf8"));
 const server=new PGLiteSocketServer({db,host:"127.0.0.1",port:55449,maxConnections:10});await server.start();const pool=new Pool({connectionString:"postgresql://postgres@127.0.0.1:55449/postgres",max:3});
 await pool.query(`INSERT INTO handa_auth_user(id,name,email,role,approval_status,"emailVerified") VALUES('admin','관리자','admin@example.test','admin','approved',true)`);
 const mails:AuthMail[]=[];const base="http://localhost:3000";const auth=createHandaAuth({database:pool,baseURL:base,secret:"test-only-profile-secret-not-used-in-production-123456",sendMail:async message=>{mails.push(message);}});
 let ip=1;const call=(path:string,body?:unknown,cookie?:string)=>auth.handler(new Request(path.startsWith("http")?path:base+"/api/auth"+path,{method:body?"POST":"GET",headers:{origin:base,"content-type":"application/json","x-forwarded-for":`192.0.2.${ip++}`,...(cookie?{cookie}:{})},body:body?JSON.stringify(body):undefined}));
 const cookies=(response:Response)=>response.headers.getSetCookie().map(value=>value.split(";")[0]).join("; ");
 async function signup(email:string){assert.equal((await call("/sign-up/email",{name:"가입 이름",email,password:"profile-test-password-12345"})).status,200);await call(mails.at(-1)!.text.match(/https?:\/\/\S+/)![0]);const id=(await pool.query("SELECT id FROM handa_auth_user WHERE email=$1",[email])).rows[0].id;return id as string;}
 return {pool,mails,call,cookies,signup,close:async()=>{await pool.end();await server.stop();await db.close();}};
}

test("approval notices persist acknowledgement per account, stay idempotent and do not swallow a later approval",async()=>{
 const c=await setup();try{
  const id=await c.signup("member@example.test");assert.equal(await getApprovalNotice(c.pool,id),null);
  await changeMembershipStatus(c.pool,"admin",id,"approved");assert.equal(await getApprovalNotice(c.pool,id),1);
  await assert.rejects(acknowledgeApprovalNotice(c.pool,id,99));assert.equal(await getApprovalNotice(c.pool,id),1);
  await acknowledgeApprovalNotice(c.pool,id,1);assert.equal(await getApprovalNotice(c.pool,id),null);await acknowledgeApprovalNotice(c.pool,id,1);
  await changeMembershipStatus(c.pool,"admin",id,"approved");assert.equal(await getApprovalNotice(c.pool,id),null);
  await changeMembershipStatus(c.pool,"admin",id,"rejected");assert.equal(await getApprovalNotice(c.pool,id),null);
  await changeMembershipStatus(c.pool,"admin",id,"approved");assert.equal(await getApprovalNotice(c.pool,id),2);
  await assert.rejects(acknowledgeApprovalNotice(c.pool,id,1));assert.equal(await getApprovalNotice(c.pool,id),2);
  await acknowledgeApprovalNotice(c.pool,id,2);assert.equal(await getApprovalNotice(c.pool,id),null);
 }finally{await c.close();}
});

test("name and password edits use the current authenticated account and password; email changes verify both addresses",async()=>{
 const c=await setup();try{
  const id=await c.signup("member@example.test");const login=await c.call("/sign-in/email",{email:"member@example.test",password:"profile-test-password-12345"});let cookie=c.cookies(login);
  assert.equal((await c.call("/update-user",{name:"승인 전 변경"},cookie)).status,403);
  await changeMembershipStatus(c.pool,"admin",id,"approved");
  assert.equal((await c.call("/update-user",{name:"   "},cookie)).status,400);
  assert.equal((await c.call("/update-user",{role:"admin",approvalStatus:"rejected"},cookie)).status,400);
  assert.equal((await c.call("/update-user",{approval_notice_seen_version:999},cookie)).status,400);
  const named=await c.call("/update-user",{name:"  수정 이름  "},cookie);assert.equal(named.status,200);cookie=c.cookies(named)||cookie;
  const profile=await getAccountProfile(c.pool,id);assert.equal(profile?.name,"수정 이름");assert.equal(profile?.role,"member");assert.equal(profile?.approvalStatus,"approved");assert.equal(profile?.hasPassword,true);assert.equal(await getApprovalNotice(c.pool,id),1);
  const secondLogin=await c.call("/sign-in/email",{email:"member@example.test",password:"profile-test-password-12345"});const otherCookie=c.cookies(secondLogin);
  assert.equal((await c.call("/change-password",{currentPassword:"incorrect",newPassword:"new-profile-password-12345",revokeOtherSessions:true},cookie)).status,400);
  const changed=await c.call("/change-password",{currentPassword:"profile-test-password-12345",newPassword:"new-profile-password-12345",revokeOtherSessions:true},cookie);assert.equal(changed.status,200);cookie=c.cookies(changed)||cookie;
  assert.equal(await(await c.call("/get-session",undefined,otherCookie)).json(),null);
  assert.equal((await c.call("/sign-in/email",{email:"member@example.test",password:"profile-test-password-12345"})).status,401);
  assert.equal((await c.call("/change-email",{newEmail:"changed@example.test",callbackURL:"/account"},cookie)).status,200);
  const oldMail=c.mails.at(-1)!;assert.equal(oldMail.to,"member@example.test");assert.match(oldMail.subject,/이메일 변경/);assert.equal((await getAccountProfile(c.pool,id))?.email,"member@example.test");
  await c.call(oldMail.text.match(/https?:\/\/\S+/)![0],undefined,cookie);
  const newMail=c.mails.at(-1)!;assert.equal(newMail.to,"changed@example.test");assert.equal((await getAccountProfile(c.pool,id))?.email,"member@example.test");
  await c.call(newMail.text.match(/https?:\/\/\S+/)![0],undefined,cookie);assert.equal((await getAccountProfile(c.pool,id))?.email,"changed@example.test");
  assert.equal((await c.call("/sign-in/email",{email:"changed@example.test",password:"new-profile-password-12345"})).status,200);
 }finally{await c.close();}
});

test("Google-linked accounts expose a readonly email and block credential changes while allowing HANDA name edits",async()=>{
 const c=await setup();try{
  const id=await c.signup("google@example.test");await changeMembershipStatus(c.pool,"admin",id,"approved");const signed=await c.call("/sign-in/email",{email:"google@example.test",password:"profile-test-password-12345"});const cookie=c.cookies(signed);
  await c.pool.query(`INSERT INTO handa_auth_account(id,"accountId","providerId","userId","updatedAt") VALUES('google-account','google-fixture','google',$1,now())`,[id]);
  assert.equal((await getAccountProfile(c.pool,id))?.googleLinked,true);
  assert.equal((await c.call("/change-email",{newEmail:"other@example.test"},cookie)).status,403);
  assert.equal((await c.call("/change-password",{currentPassword:"profile-test-password-12345",newPassword:"replacement-password-12345"},cookie)).status,403);
  assert.equal((await c.call("/update-user",{name:"구글 사용자 이름 변경"},cookie)).status,200);
  await c.pool.query(`DELETE FROM handa_auth_account WHERE "userId"=$1 AND "providerId"='credential'`,[id]);
  const profile=await getAccountProfile(c.pool,id);assert.equal(profile?.hasPassword,false);assert.equal(profile?.name,"구글 사용자 이름 변경");assert.equal(profile?.email,"google@example.test");
 }finally{await c.close();}
});


test("migration gives existing approved members one notice while pending accounts remain unnotified",async()=>{
 const db=new PGlite();try{
  await db.exec(await readFile(new URL("../database/migrations/002_member_auth.sql",import.meta.url),"utf8"));
  await db.exec(`INSERT INTO handa_auth_user(id,name,email,role,approval_status,"emailVerified") VALUES('existing','기존 회원','existing@example.test','member','approved',true),('waiting','대기 회원','waiting@example.test','member','pending',true)`);
  await db.exec(await readFile(new URL("../database/migrations/007_account_profile_notice.sql",import.meta.url),"utf8"));
  const result=await db.query("SELECT id,approval_notice_version,approval_notice_seen_version FROM handa_auth_user ORDER BY id");
  assert.deepEqual(result.rows,[{id:"existing",approval_notice_version:1,approval_notice_seen_version:0},{id:"waiting",approval_notice_version:0,approval_notice_seen_version:0}]);
 }finally{await db.close();}
});


test("visibility defaults private, persists only for an approved account and leaves the true join date unchanged",async()=>{
 const c=await setup();try{
  const id=await c.signup("visibility@example.test");const initial=await getAccountProfile(c.pool,id);
  assert.equal(initial?.profileVisibility,"private");assert.ok(initial?.joinedAt instanceof Date);
  const joined=initial!.joinedAt.toISOString();
  await assert.rejects(updateProfileVisibility(c.pool,id,"public"),/이용 승인/);
  await changeMembershipStatus(c.pool,"admin",id,"approved");
  for(const value of ["members","public","private"]){await updateProfileVisibility(c.pool,id,value);assert.equal((await getAccountProfile(c.pool,id))?.profileVisibility,value);}
  await assert.rejects(updateProfileVisibility(c.pool,id,"admins"),/다시 선택/);
  await assert.rejects(updateProfileVisibility(c.pool,id,"public'; UPDATE handa_auth_user SET role='admin'; --"),/다시 선택/);
  assert.equal((await getAccountProfile(c.pool,"admin"))?.profileVisibility,"private");
  const final=await getAccountProfile(c.pool,id);assert.equal(final?.profileVisibility,"private");assert.equal(final?.joinedAt.toISOString(),joined);assert.equal(final?.role,"member");
  await changeMembershipStatus(c.pool,"admin",id,"rejected");await assert.rejects(updateProfileVisibility(c.pool,id,"public"),/이용 승인/);
 }finally{await c.close();}
});

test("future public-profile policy respects privacy, approved membership, and withdrawn owners",()=>{
 const base={id:"owner",role:"member",approvalStatus:"approved",emailVerified:true};
 const member={...base,id:"viewer"};const admin={...member,role:"admin"};
 const privateOwner={...base,profileVisibility:"private" as const};const memberOwner={...base,profileVisibility:"members" as const};const publicOwner={...base,profileVisibility:"public" as const};
 assert.equal(canViewMemberProfile(privateOwner,base),true);assert.equal(canViewMemberProfile(privateOwner,member),false);assert.equal(canViewMemberProfile(privateOwner,admin),false);
 assert.equal(canViewMemberProfile(memberOwner,null),false);assert.equal(canViewMemberProfile(memberOwner,member),true);assert.equal(canViewMemberProfile(memberOwner,admin),true);
 assert.equal(canViewMemberProfile(memberOwner,{...member,approvalStatus:"pending"}),false);assert.equal(canViewMemberProfile(memberOwner,{...member,emailVerified:false}),false);
 assert.equal(canViewMemberProfile(publicOwner,null),true);assert.equal(canViewMemberProfile({...publicOwner,approvalStatus:"rejected"},null),false);
});
