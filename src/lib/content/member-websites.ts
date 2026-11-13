/** Accept bare domains while leaving explicit protocols for validation. */
export function normalizeMemberWebsite(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const url = value.trim();
  if (!url || /^[a-z][a-z\d+.-]*:/i.test(url)) return url;
  return /^(?:[^\s/:?#]+\.)+[^\s/:?#]+(?::\d+)?(?:[/?#].*)?$/.test(url) ? `https://${url}` : url;
}

/** An explicit empty list means all links were removed; otherwise retain legacy links. */
export function getMemberWebsites(member: { website?: unknown; websites?: unknown }): string[] {
  const values = Array.isArray(member.websites) ? member.websites : [member.website];
  return values.filter((value): value is string => typeof value === "string" && Boolean(value.trim()));
}
