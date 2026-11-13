import assert from "node:assert/strict";
import { test } from "node:test";
import { contentSchemas, parseContent } from "../src/lib/content/schema";
import { memberRecords } from "../src/data/members";
import { getMemberWebsites, getMemberWebsiteLinks, memberWebsiteLabel, memberWebsiteFields } from "../src/lib/content/member-websites";
import { imageURLs } from "../src/lib/content/media-access";

const member = memberRecords[0];

test("legacy member links remain editable and bare domains save as HTTPS", () => {
  for (const website of ["example.com", "www.example.com", " https://example.com "]) {
    const parsed = parseContent("member", { ...member, website });
    assert.equal(parsed.website, website.trim().startsWith("www.") ? "https://www.example.com" : "https://example.com");
    assert.deepEqual(getMemberWebsites(parsed), [parsed.website]);
  }
  assert.deepEqual(getMemberWebsites(member), []);
});

test("multiple optional links preserve order, ignore blanks and allow removing every link", () => {
  const parsed = parseContent("member", { ...member, website: "https://old.example.com", websites: [" example.com/a ", "", "  ", "https://second.example.com/?q=1"] });
  assert.deepEqual(parsed.websites, ["https://example.com/a", "https://second.example.com/?q=1"]);
  assert.equal(parsed.website, parsed.websites![0]);
  const cleared = parseContent("member", { ...parsed, websites: [""] });
  assert.equal(cleared.website, null);
  assert.deepEqual(getMemberWebsites(cleared), []);
});

test("malformed URLs return validation errors rather than throwing inside safeParse", () => {
  for (const website of ["javascript:alert(1)", "data:text/html,test", "ftp://example.com", "//example.com", "bad address", "https://", "https://exa mple.com"]) {
    assert.equal(contentSchemas.member.safeParse({ ...member, websites: [website] }).success, false, website);
  }
  assert.equal(contentSchemas.page.safeParse({ ctaUrl: "not a URL" }).success, false);
});

test("named links and legacy URLs coexist, normalize and retain safe display labels", () => {
  const parsed = parseContent("member", { ...member, websites: [{ name: " 회사 홈페이지 ", url: "example.com/about" }, "https://www.second.com", { name: "", url: "" }] });
  assert.deepEqual(parsed.websites, [{ name: "회사 홈페이지", url: "https://example.com/about" }, "https://www.second.com"]);
  assert.equal(parsed.website, "https://example.com/about");
  const links = getMemberWebsiteLinks(parsed);
  assert.equal(memberWebsiteLabel(links[0]), "회사 홈페이지");
  assert.equal(memberWebsiteLabel(links[1]), "www.second.com");
  assert.deepEqual(getMemberWebsites(parsed), ["https://example.com/about", "https://www.second.com"]);
  assert.deepEqual(imageURLs({ ...parsed, photoUrl: "/api/images/photo" }), ["/api/images/photo"]);
  assert.throws(() => parseContent("member", { ...member, websites: [{ name: "Unsafe", url: "javascript:alert(1)" }] }));
});

test("form serialization keeps names paired when empty rows are skipped", () => {
  const form = new FormData();
  for (const [name, url] of [["이름만", ""], ["회사", " example.com "], ["", "https://second.com"]]) {
    form.append("websiteNames", name);
    form.append("websites", url);
  }
  assert.deepEqual(memberWebsiteFields(form), [{ name: "회사", url: "example.com" }, { name: "", url: "https://second.com" }]);
});
