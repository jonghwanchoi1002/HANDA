import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { getInitialContent } from "../src/lib/content/initial";
import { parseContent } from "../src/lib/content/schema";
import { readPublishedContent, type ContentQuery } from "../src/lib/content/repository";

async function setup() {
  const db = new PGlite();
  await db.exec(await readFile(new URL("../database/migrations/001_content.sql", import.meta.url), "utf8"));
  return db;
}
async function seed(db: PGlite) {
  for (const entry of getInitialContent()) {
    const payload = parseContent(entry.kind, entry.payload);
    await db.query(`INSERT INTO handa_content (kind,content_key,payload,status,is_example,publication_consent,sort_order)
      VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7) ON CONFLICT (kind,content_key) DO NOTHING`,
    [entry.kind,entry.key,JSON.stringify(payload),entry.status,"isExample" in payload && payload.isExample,entry.consent,entry.order]);
  }
}
function queryFor(db: PGlite): ContentQuery {
  return (sql, values) => db.query<{ payload: unknown }>(sql, values);
}

test("migration and initialization support all content types; repeated seed preserves edits", async () => {
  const db = await setup();
  try {
    await seed(db);
    const expected = { home: 1, wiki: 3, member: 3, story: 2, testimonial: 3 } as const;
    for (const kind of Object.keys(expected) as (keyof typeof expected)[]) {
      assert.equal((await readPublishedContent(queryFor(db), kind)).length, expected[kind]);
    }
    await db.query(`UPDATE handa_content SET payload=jsonb_set(payload,'{heroTitle}','"수정된 제목"'::jsonb) WHERE kind='home'`);
    await seed(db);
    const home = await readPublishedContent(queryFor(db), "home", "homepage");
    assert.equal(home[0].heroTitle, "수정된 제목");
    assert.equal((await db.query<{ count: number }>("SELECT count(*)::int as count FROM handa_content")).rows[0].count,12);
  } finally { await db.close(); }
});

test("drafts stay private, unknown and SQL-like keys return no result, empty tables stay empty", async () => {
  const db = await setup();
  try {
    assert.deepEqual(await readPublishedContent(queryFor(db), "wiki"), []);
    await seed(db);
    await db.query("UPDATE handa_content SET status='draft' WHERE kind='wiki' AND content_key='first-business-checklist'");
    assert.equal((await readPublishedContent(queryFor(db), "wiki")).length,2);
    assert.deepEqual(await readPublishedContent(queryFor(db), "wiki", "first-business-checklist"), []);
    assert.deepEqual(await readPublishedContent(queryFor(db), "wiki", "' OR true --"), []);
    assert.deepEqual(await readPublishedContent(queryFor(db), "member", "missing"), []);
  } finally { await db.close(); }
});

test("real testimonials require consent and internal fields never reach public payloads", async () => {
  const db = await setup();
  try {
    await seed(db);
    await assert.rejects(db.query(`UPDATE handa_content SET is_example=false, payload=jsonb_set(payload,'{isExample}','false') WHERE kind='testimonial'`));
    await db.query(`UPDATE handa_content SET is_example=false, publication_consent=true, payload=jsonb_set(payload,'{isExample}','false') WHERE kind='testimonial'`);
    const entries = await readPublishedContent(queryFor(db), "testimonial");
    assert.equal(entries.length,3);
    assert.equal(entries[0].id,"sample-connection");
    assert.ok(entries.every((item) => !item.isExample && !("status" in item) && !("publicationConsent" in item)));
  } finally { await db.close(); }
});

test("invalid database content fails validation rather than silently displaying samples", async () => {
  const db = await setup();
  try {
    await seed(db);
    await db.query(`UPDATE handa_content SET payload=payload-'title' WHERE kind='wiki' AND content_key='first-business-checklist'`);
    await assert.rejects(readPublishedContent(queryFor(db), "wiki"), /Invalid wiki content/);
    assert.throws(() => parseContent("member", { slug: "bad", website: "javascript:alert(1)" }));
  } finally { await db.close(); }
});

test("image blocks retain order and captions; duplicate block IDs are rejected", () => {
  const story = getInitialContent().find((entry) => entry.kind === "story")!;
  const payload = parseContent("story",story.payload);
  const image = { id: "photo-block", type: "image" as const, image: { id: "photo", url: "https://example.com/photo.jpg", alt: "모임 사진", caption: "사진 설명", width: 1200, height: 800 } };
  const parsed = parseContent("story", { ...payload, blocks: [payload.blocks[0],image,...payload.blocks.slice(1)] });
  assert.equal(parsed.blocks[1].type,"image");
  assert.equal(parsed.blocks[1].type === "image" && parsed.blocks[1].image.caption,"사진 설명");
  assert.throws(() => parseContent("story", { ...payload, blocks: [image,image] }));
});

test("actual migration, seed and check commands work over PostgreSQL protocol and can be repeated", async () => {
  const { PGLiteSocketServer } = await import("@electric-sql/pglite-socket");
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const run = promisify(execFile);
  const db = new PGlite();
  const server = new PGLiteSocketServer({ db, port: 55439, host: "127.0.0.1" });
  await server.start();
  const env = { ...process.env, DATABASE_URL: "postgresql://postgres@127.0.0.1:55439/postgres", CONTENT_SOURCE: "database" };
  const command = (file: string) => run(process.execPath, ["--import", "tsx", file], { env, timeout: 20000 });
  try {
    await assert.rejects(command("scripts/auth-check.ts"), (error: unknown) => {
      assert.match((error as { stdout: string }).stdout, /handa_auth_user: MISSING/);
      return true;
    });
    await command("scripts/db-migrate.ts");
    const second = await command("scripts/db-migrate.ts");
    assert.match(second.stdout, /Already applied/);
    await command("scripts/db-seed.ts");
    const repeat = await command("scripts/db-seed.ts");
    assert.match(repeat.stdout, /Added 0 content entries/);
    const check = await command("scripts/db-check.ts");
    assert.match(check.stdout, /Database connection and public content validation passed/);
    const authCheck = await command("scripts/auth-check.ts");
    assert.match(authCheck.stdout, /Authentication tables are present/);
  } finally { await server.stop(); await db.close(); }
});
