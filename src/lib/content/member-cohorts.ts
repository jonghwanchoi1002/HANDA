export type MemberCohort = { name: string; period: string };

export function getMemberCohorts(member: { cohorts?: unknown }): MemberCohort[] {
  return Array.isArray(member.cohorts) ? member.cohorts.flatMap(value => {
    if (!value || typeof value !== "object" || typeof value.name !== "string") return [];
    return [{ name: value.name, period: typeof value.period === "string" ? value.period : "" }];
  }) : [];
}

export function memberCohortFields(form: FormData): MemberCohort[] {
  const periods = form.getAll("cohortPeriods");
  return form.getAll("cohortNames").map((name, index) => ({ name: String(name).trim(), period: String(periods[index] ?? "").trim() })).filter(item => item.name || item.period);
}
