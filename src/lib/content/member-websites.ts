/** Accept bare domains while leaving explicit protocols for validation. */
export function normalizeMemberWebsite(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const url = value.trim();
  if (!url || /^[a-z][a-z\d+.-]*:/i.test(url)) return url;
  return /^(?:[^\s/:?#]+\.)+[^\s/:?#]+(?::\d+)?(?:[/?#].*)?$/.test(url) ? `https://${url}` : url;
}

/** An explicit empty list means all links were removed; otherwise retain legacy links. */
export type MemberWebsiteLink = { name: string; url: string };

export function getMemberWebsiteLinks(member: { website?: unknown; websites?: unknown }): MemberWebsiteLink[] {
  const values = Array.isArray(member.websites) ? member.websites : [member.website];
  return values.flatMap(value => {
    if (typeof value === "string" && value.trim()) return [{ name: "", url: value }];
    if (value && typeof value === "object" && typeof value.url === "string" && value.url.trim()) return [{ name: typeof value.name === "string" ? value.name : "", url: value.url }];
    return [];
  });
}

export function getMemberWebsites(member: { website?: unknown; websites?: unknown }): string[] {
  return getMemberWebsiteLinks(member).map(link => link.url);
}

export function memberWebsiteLabel(link: MemberWebsiteLink): string {
  return link.name.trim() || link.url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function memberWebsiteFields(form: FormData): MemberWebsiteLink[] {
  const names = form.getAll("websiteNames");
  return form.getAll("websites").map((url, index) => ({ name: String(names[index] ?? "").trim(), url: String(url).trim() })).filter(link => link.url);
}
