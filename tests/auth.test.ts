import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { Pool } from "pg";
import { createHandaAuth, authOptions, type AuthMail } from "../src/lib/auth/config";
import { canReadWiki, canManageMembers } from "../src/lib/auth/permissions";
import { changeMembershipStatus } from "../src/lib/auth/membership";

test("role and approval matrix denies visitors, pending/rejected/unverified users and member writes", () => {
  assert.equal(canReadWiki(null),false);
  for (const role of ["member","admin"]) {
    for (const approvalStatus of ["pending","rejected"]) assert.equal(canReadWiki({role,approvalStatus,emailVerified:true}),false);
    assert.equal(canReadWiki({role,approvalStatus:"approved",emailVerified:false}),false);
    assert.equal(canReadWiki({role,approvalStatus:"approved",emailVerified:true}),true);
  }
  assert.equal(canManageMembers({role:"member",approvalStatus:"approved",emailVerified:true}),false);
  assert.equal(canManageMembers({role:"admin",approvalStatus:"approved",emailVerified:true}),true);
});

test("real auth handler: verify email, sign in, admin approval/revocation, reset password, CSRF and OAuth initiation", {timeout:60000}, async () => {
  const db = new PGlite();
  await db.exec(await readFile(new URL("../database/migrations/002_member_auth.sql",import.meta.url),"utf8"));
  const server = new PGLiteSocketServer({db,port:55443,host:"127.0.0.1",maxConnections:10}); await server.start();
  const pool = new Pool({connectionString:"postgresql://postgres@127.0.0.1:55443/postgres",max:3});
  const mail: AuthMail[]=[];
  const auth = createHandaAuth({database:pool,baseURL:"http://localhost:3000",secret:"test-only-random-secret-not-used-in-deployment-12345",sendMail:async message=>{mail.push(message);},google:{clientId:"test-google-client",clientSecret:"test-google-secret"}});
  let ip=1;
  async function request(path:string,body?:unknown,cookie?:string,origin="http://localhost:3000") {
    return auth.handler(new Request(path.startsWith("http")?path:`http://localhost:3000/api/auth${path}`,{
      method:body===undefined?"GET":"POST",headers:{origin,"content-type":"application/json","x-forwarded-for":`192.0.2.${ip++}`,...(cookie?{cookie}:{})},body:body===undefined?undefined:JSON.stringify(body),
    }));
  }
  const cookies=(response:Response)=>response.headers.getSetCookie().map(value=>value.split(";")[0]).join("; ");
  async function verify(email:string) {
    const message=mail.filter(m=>m.to===email && m.subject.includes("주소 확인")).at(-1); assert.ok(message);
    const url=message.text.match(/https?:\/\/\S+/)![0]; const response=await request(url); assert.equal(response.status,302);
  }
  async function membership(email:string) {return (await pool.query(`SELECT id,role,approval_status AS "approvalStatus","emailVerified" FROM handa_auth_user WHERE email=$1`,[email])).rows[0];}
  try {
    const password="correct-horse-battery-test-123";
    const signup=await request("/sign-up/email",{email:"member@example.test",password,name:"테스트 회원",role:"admin",approvalStatus:"approved",callbackURL:"/login?verified=1"});
    assert.equal(signup.status,200,await signup.text());
    assert.equal((await membership("member@example.test")).role,"member");assert.equal((await membership("member@example.test")).approvalStatus,"pending");
    const hash=(await pool.query(`SELECT password FROM handa_auth_account WHERE "providerId"='credential'`)).rows[0].password;assert.notEqual(hash,password);assert.ok(hash.length>64);
    const unverified=await request("/sign-in/email",{email:"member@example.test",password});assert.equal(unverified.status,403);
    await verify("member@example.test");
    const signin=await request("/sign-in/email",{email:"member@example.test",password});assert.equal(signin.status,200);const cookie=cookies(signin);assert.ok(cookie.includes("session_token"));
    const session=await request("/get-session",undefined,cookie);assert.equal((await session.json()).user.email,"member@example.test");
    const member=await membership("member@example.test");assert.equal(canReadWiki(member),false);
    await request("/update-user",{role:"admin",approvalStatus:"approved"},cookie);
    assert.equal((await membership("member@example.test")).role,"member");
    assert.equal((await membership("member@example.test")).approvalStatus,"pending");
    assert.match(signin.headers.getSetCookie().find(value=>value.includes("session_token"))!, /HttpOnly/i);
    await assert.rejects(changeMembershipStatus(pool,member.id,member.id,"approved"));
    await request("/sign-up/email",{email:"admin@example.test",password,name:"테스트 운영자",callbackURL:"/login?verified=1"});await verify("admin@example.test");
    const run=promisify(execFile);await run(process.execPath,["--import","tsx","scripts/admin-grant.ts","admin@example.test"],{env:{...process.env,DATABASE_URL:"postgresql://postgres@127.0.0.1:55443/postgres"},timeout:15000});
    const admin=await membership("admin@example.test");assert.equal(canManageMembers(admin),true);
    await changeMembershipStatus(pool,admin.id,member.id,"approved");assert.equal(canReadWiki(await membership("member@example.test")),true);
    await changeMembershipStatus(pool,admin.id,member.id,"rejected");assert.equal(canReadWiki(await membership("member@example.test")),false);
    await changeMembershipStatus(pool,admin.id,member.id,"approved");
    assert.equal((await pool.query("SELECT count(*)::int AS count FROM handa_membership_audit")).rows[0].count,4);
    await request("/sign-up/email",{email:"unverified@example.test",password,name:"미인증 사용자"});const pending=await membership("unverified@example.test");await assert.rejects(changeMembershipStatus(pool,admin.id,pending.id,"approved"));
    const blocked=await request("/sign-in/email",{email:"member@example.test",password},undefined,"https://untrusted.example");assert.equal(blocked.status,403);
    const oauth=await request("/sign-in/social",{provider:"google",callbackURL:"/account"});assert.equal(oauth.status,200);const oauthData=await oauth.json();const googleURL=new URL(oauthData.url);assert.equal(googleURL.hostname,"accounts.google.com");assert.ok(googleURL.searchParams.get("state"));assert.equal(googleURL.searchParams.get("redirect_uri"),"http://localhost:3000/api/auth/callback/google");
    const externalCallback=await request("/sign-in/social",{provider:"google",callbackURL:"https://untrusted.example/steal"});assert.equal(externalCallback.status,403);
    const badState=await request("/callback/google?state=invalid&code=invalid");assert.ok(badState.status>=300&&badState.status<400);assert.ok(!cookies(badState).includes("session_token"));
    const reset=await request("/request-password-reset",{email:"member@example.test",redirectTo:"/reset-password"});assert.equal(reset.status,200);
    const resetMail=mail.filter(m=>m.subject.includes("비밀번호")&&m.to==="member@example.test").at(-1)!;assert.ok(resetMail);
    const resetLink=resetMail.text.match(/https?:\/\/\S+/)![0];const forwarded=await request(resetLink);const token=new URL(forwarded.headers.get("location")!,"http://localhost:3000").searchParams.get("token");assert.ok(token);
    const changed=await request("/reset-password",{token,newPassword:"replacement-password-12345"});assert.equal(changed.status,200);
    assert.equal(await (await request("/get-session",undefined,cookie)).json(),null);
    assert.equal((await request("/reset-password",{token,newPassword:"another-password-12345"})).status,400);
    const wrong=await request("/sign-in/email",{email:"member@example.test",password});assert.equal(wrong.status,401);
    const newLogin=await request("/sign-in/email",{email:"member@example.test",password:"replacement-password-12345"});assert.equal(newLogin.status,200);
    for(let attempt=0;attempt<6;attempt++){
      const response=await auth.handler(new Request("http://localhost:3000/api/auth/sign-in/email",{method:"POST",headers:{origin:"http://localhost:3000","content-type":"application/json","x-forwarded-for":"192.0.2.252"},body:JSON.stringify({email:"member@example.test",password:"incorrect-password-12345"})}));
      assert.equal(response.status,attempt<5?401:429);
    }
  } finally {await pool.end();await server.stop();await db.close();}
});

test("auth configuration protects additional fields and persists throttling without cookie authorization cache", () => {
  // Provider configuration alone does not make a person an administrator.
  const settings = { database: {} as Pool, baseURL:"https://handa.example", secret:"test-only-config-secret-not-for-production" };
  const options = authOptions(settings);
  assert.equal(options.user.additionalFields.role.input,false);
  assert.equal(options.user.additionalFields.approvalStatus.input,false);
  assert.equal(options.session.cookieCache.enabled,false);
  assert.equal(options.rateLimit.storage,"database");
  assert.equal(options.emailAndPassword.enabled,false);
});
