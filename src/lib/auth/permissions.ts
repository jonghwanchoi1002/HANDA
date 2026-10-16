export type Membership = { role: string; approvalStatus: string; emailVerified: boolean };
export function canReadWiki(user: Membership | null): boolean {
  return Boolean(user?.emailVerified && user.approvalStatus === "approved" && ["member", "admin"].includes(user.role));
}
export function canManageMembers(user: Membership | null): boolean {
  return canReadWiki(user) && user?.role === "admin";
}
