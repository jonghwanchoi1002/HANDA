import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { Pool } from "pg";
import { changeMemberRole, changeMembershipStatus } from "../src/lib/auth/membership";
import { listManagedMembers } from "../src/lib/auth/member-list";

async function setup() {
  const db = new PGlite();
  for(const name of ["002_member_auth.sql","003_member_management.sql"])await db.exec(await readFile(new URL(`../database/migrations/${name}`,import.meta.url),"utf8"));
  const server = new PGLiteSocketServer({db,port:55446,host:"127.0.0.1",maxConnections:10});await server.start();
  const pool = new Pool({connectionString:"postgresql://postgres@127.0.0.1:55446/postgres",max:3});
  async function user(id:string,role="member",status="approved",verified=true) {
    await pool.query(`INSERT INTO handa_auth_user(id,name,email,role,approval_status,"emailVerified") VALUES($1,$1,$2,$3,$4,$5)`,[id,`${id}@example.test`,role,status,verified]);
  }
  return {pool,user,close:async()=>{await pool.end();await server.stop();await db.close();}};
}

test("approved verified member promotion and demotion preserve membership and record actor and roles", async()=>{
  const context=await setup();const {pool,user}=context;
  try{
    await user("operator","admin");await user("friend");
    await changeMemberRole(pool,"operator","friend","admin");
    assert.equal((await pool.query("SELECT role FROM handa_auth_user WHERE id='friend'")).rows[0].role,"admin");
    await changeMemberRole(pool,"operator","friend","member");
    const target=(await pool.query("SELECT role,approval_status FROM handa_auth_user WHERE id='friend'")).rows[0];assert.deepEqual(target,{role:"member",approval_status:"approved"});
    const audit=await pool.query("SELECT actor_id,action,previous_role,new_role FROM handa_membership_audit ORDER BY id");
    assert.deepEqual(audit.rows,[{actor_id:"operator",action:"grant_admin",previous_role:"member",new_role:"admin"},{actor_id:"operator",action:"revoke_admin",previous_role:"admin",new_role:"member"}]);
  }finally{await context.close();}
});

test("members cannot manage roles; pending/unverified targets, last admin and self-demotion are protected",async()=>{
  const context=await setup();const {pool,user}=context;
  try{
    await user("operator","admin");await user("member");await user("pending","member","pending");await user("unverified","member","approved",false);
    await assert.rejects(changeMemberRole(pool,"member","member","admin"),/관리자 권한/);
    await assert.rejects(changeMemberRole(pool,"operator","pending","admin"),/이메일 확인과 이용 승인/);
    await assert.rejects(changeMemberRole(pool,"operator","unverified","admin"),/이메일 확인과 이용 승인/);
    await assert.rejects(changeMemberRole(pool,"operator","operator","member"),/마지막 관리자/);
    await assert.rejects(changeMembershipStatus(pool,"operator","operator","rejected"));
    assert.equal((await pool.query("SELECT count(*)::int AS count FROM handa_membership_audit")).rows[0].count,0);
    await changeMemberRole(pool,"operator","member","admin");
    await assert.rejects(changeMemberRole(pool,"operator","operator","member"),/본인의 관리자/);
    await changeMemberRole(pool,"member","operator","member");
    await assert.rejects(changeMemberRole(pool,"operator","pending","admin"),/관리자 권한/);
  }finally{await context.close();}
});

test("simultaneous cross-demotion leaves an active admin and rechecks the actor in the transaction",async()=>{
  const context=await setup();const {pool,user}=context;
  try{
    await user("admin-a","admin");await user("admin-b","admin");
    const results=await Promise.allSettled([changeMemberRole(pool,"admin-a","admin-b","member"),changeMemberRole(pool,"admin-b","admin-a","member")]);
    assert.equal(results.filter(result=>result.status==="fulfilled").length,1);
    assert.equal((await pool.query("SELECT count(*)::int AS count FROM handa_auth_user WHERE role='admin' AND approval_status='approved' AND \"emailVerified\"=true")).rows[0].count,1);
  }finally{await context.close();}
});

test("member list supports literal search, combined filters, complete pagination and safe public fields",async()=>{
  const context=await setup();const {pool,user}=context;
  try{
    await user("operator","admin");
    for(let index=0;index<25;index++)await user(`member-${String(index).padStart(2,"0")}`,"member",index<3?"pending":"approved");
    const filter={query:"",status:"all" as const,role:"all" as const,page:1};
    const first=await listManagedMembers(pool,filter);assert.equal(first.total,26);assert.equal(first.members.length,20);assert.equal(first.pages,2);assert.equal(first.members[0].status,"pending");
    const second=await listManagedMembers(pool,{...filter,page:2});assert.equal(second.members.length,6);assert.equal(new Set([...first.members,...second.members].map(member=>member.id)).size,26);
    const selected=await listManagedMembers(pool,{...filter,query:"MEMBER",status:"pending",role:"member"});assert.equal(selected.total,3);
    assert.equal((await listManagedMembers(pool,{...filter,role:"admin"})).members[0].id,"operator");
    assert.equal((await listManagedMembers(pool,{...filter,query:"%' OR 1=1 --"})).total,0);
    assert.equal((await listManagedMembers(pool,{...filter,page:999})).page,2);
    assert.ok(first.members.every(member=>!("password" in member)&&!("token" in member)));
  }finally{await context.close();}
});
