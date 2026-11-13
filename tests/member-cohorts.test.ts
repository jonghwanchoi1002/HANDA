import assert from "node:assert/strict";
import { test } from "node:test";
import { memberCohortFields, getMemberCohorts } from "../src/lib/content/member-cohorts";
import { parseContent } from "../src/lib/content/schema";
import { memberRecords } from "../src/data/members";

test("cohorts are optional for old profiles and preserve names, periods and order", () => {
  assert.equal(parseContent("member", memberRecords[0]).cohorts, undefined);
  assert.deepEqual(getMemberCohorts(memberRecords[0]), []);
  const cohorts = [{ name: "파일럿", period: "2025.12 – 2026.5" }, { name: "1기", period: "2026.6 – 8" }, { name: "2기", period: "" }];
  assert.deepEqual(parseContent("member", { ...memberRecords[0], cohorts }).cohorts, cohorts);
  assert.deepEqual(parseContent("member", { ...memberRecords[0], cohorts: [] }).cohorts, []);
  assert.throws(() => parseContent("member", { ...memberRecords[0], cohorts: [{ name: "", period: "2026" }] }));
  assert.throws(() => parseContent("member", { ...memberRecords[0], cohorts: [{ name: "x".repeat(81), period: "" }] }));
});

test("form serialization omits empty rows while retaining period/name pairing", () => {
  const form = new FormData();
  for (const [name, period] of [[" 파일럿 ", " 2025.12 – 2026.5 "], ["", ""], ["1기", "2026.6 – 8"], ["2기", ""]]) {
    form.append("cohortNames", name); form.append("cohortPeriods", period);
  }
  assert.deepEqual(memberCohortFields(form), [{ name: "파일럿", period: "2025.12 – 2026.5" }, { name: "1기", period: "2026.6 – 8" }, { name: "2기", period: "" }]);
});
