import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { Pool } from "pg";
import { createHandaAuth, authOptions, type AuthMail } from "../src/lib/auth/config";
import { emailAddressAliases, normalizeEmailAddress, resolveGoogleEmail } from "../src/lib/auth/email-address";

test("only gmail.com and googlemail.com domains are equivalent", () => {
  assert.equal(normalizeEmailAddress(" Test.User+tag@GOOGLEMAIL.COM "), "test.user+tag@gmail.com");
  assert.deepEqual(emailAddressAliases("TEST@gmail.com"), ["test@gmail.com", "test@googlemail.com"]);
  assert.deepEqual(emailAddressAliases("test@googlemail.com.example"), ["test@googlemail.com.example"]);
  assert.notEqual(normalizeEmailAddress("test.user@gmail.com"), normalizeEmailAddress("testuser@gmail.com"));
  assert.notEqual(normalizeEmailAddress("test+tag@gmail.com"), normalizeEmailAddress("test@gmail.com"));
});

test("Gmail aliases share signup, login, verification and reset lookup while legacy duplicate identities stay separate", { timeout: 60000 }, async () => {
  const db = new PGlite();
  for (const name of ["002_member_auth.sql", "003_member_management.sql"]) await db.exec(await readFile(new URL(`../database/migrations/${name}`, import.meta.url), "utf8"));
  const server = new PGLiteSocketServer({ db, port: 55452, host: "127.0.0.1", maxConnections: 10 });
  await server.start();
  const pool = new Pool({ connectionString: "postgresql://postgres@127.0.0.1:55452/postgres", max: 3 });
  const mails: AuthMail[] = [];
  const settings = { database: pool, baseURL: "http://localhost:3000", secret: "test-only-email-alias-secret-not-for-production-12345", sendMail: async (mail: AuthMail) => { mails.push(mail); }, google: { clientId: "test", clientSecret: "test" } };
  const auth = createHandaAuth(settings);
  let ip = 1;
  const password = "alias-test-password-12345";
  const request = (path: string, body?: unknown) => auth.handler(new Request(path.startsWith("http") ? path : `${settings.baseURL}/api/auth${path}`, {
    method: body ? "POST" : "GET", headers: { origin: settings.baseURL, "content-type": "application/json", "x-forwarded-for": `192.0.2.${ip++}` }, body: body ? JSON.stringify(body) : undefined,
  }));
  const signup = (email: string) => request("/sign-up/email", { email, password, name: "테스트 회원", callbackURL: "/login?verified=1" });
  const verify = async () => {
    const link = mails.at(-1)!.text.match(/https?:\/\/\S+/)![0];
    assert.equal((await request(link)).status, 302);
  };
  const login = (email: string) => request("/sign-in/email", { email, password });
  try {
    assert.equal((await signup("Alias.User@googlemail.com")).status, 200);
    assert.equal(mails.at(-1)!.to, "alias.user@gmail.com");
    const count = mails.length;
    assert.equal((await signup("alias.user@gmail.com")).status, 409);
    assert.equal(mails.length, count);
    assert.equal((await request("/send-verification-email", { email: "alias.user@googlemail.com", callbackURL: "/login?verified=1" })).status, 200);
    await verify();
    const first = await login("alias.user@gmail.com");
    const second = await login("alias.user@googlemail.com");
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    const userId = (await first.json()).user.id;
    assert.equal((await second.json()).user.id, userId);
    assert.equal((await request("/request-password-reset", { email: "alias.user@googlemail.com", redirectTo: "/reset-password" })).status, 200);
    assert.equal(mails.at(-1)!.to, "alias.user@gmail.com");
    assert.equal((await pool.query("SELECT count(*)::int AS count FROM handa_auth_user")).rows[0].count, 1);

    // Model an old account without rewriting its address, roles, sessions or content.
    await pool.query("UPDATE handa_auth_user SET email='alias.user@googlemail.com' WHERE id=$1", [userId]);
    const legacy = await login("alias.user@gmail.com");
    assert.equal(legacy.status, 200);
    assert.equal((await legacy.json()).user.id, userId);
    assert.equal((await signup("alias.user@gmail.com")).status, 409);
    assert.equal(await resolveGoogleEmail(pool, { sub: "new-google-id", email: "alias.user@gmail.com", email_verified: true }), "alias.user@googlemail.com");

    // Existing duplicates remain separate; each exact address keeps its original identity.
    await pool.query(`INSERT INTO handa_auth_user(id,name,email,"emailVerified",role,approval_status) VALUES('legacy-second','기존 Google 회원','alias.user@gmail.com',true,'member','approved')`);
    await pool.query(`INSERT INTO handa_auth_account(id,"accountId","providerId","userId","updatedAt") VALUES('legacy-google','bound-google-id','google','legacy-second',now())`);
    assert.equal((await login("alias.user@gmail.com")).status, 401);
    const original = await login("alias.user@googlemail.com");
    assert.equal(original.status, 200);
    assert.equal((await original.json()).user.id, userId);
    assert.equal(await resolveGoogleEmail(pool, { sub: "bound-google-id", email: "alias.user@googlemail.com", email_verified: true }), "alias.user@gmail.com");
    assert.equal(await resolveGoogleEmail(pool, { sub: "unverified", email: "alias.user@gmail.com", email_verified: false }), "alias.user@gmail.com");
    assert.equal((await signup("alias.user@googlemail.com")).status, 409);
    assert.equal((await pool.query("SELECT count(*)::int AS count FROM handa_auth_user")).rows[0].count, 2);

    // Google receives a canonical address before a new local user is created.
    assert.equal(await resolveGoogleEmail(pool, { sub: "brand-new-google-id", email: "brand.new@googlemail.com", email_verified: true }), "brand.new@gmail.com");
    assert.equal(authOptions(settings).account.accountLinking.requireLocalEmailVerified, true);
  } finally { await pool.end(); await server.stop(); await db.close(); }
});
