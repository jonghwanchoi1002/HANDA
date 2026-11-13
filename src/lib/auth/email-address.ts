import type { Pool } from "pg";

/** Only Gmail's two domain names are equivalent; dots and plus tags are unchanged. */
export function normalizeEmailAddress(email: string): string {
  return email.trim().toLowerCase().replace(/@googlemail\.com$/, "@gmail.com");
}

export function emailAddressAliases(email: string): string[] {
  const normalized = normalizeEmailAddress(email);
  return normalized.endsWith("@gmail.com") ? [normalized, normalized.replace(/@gmail\.com$/, "@googlemail.com")] : [normalized];
}

/** Preserve exact existing identities if both aliases already have separate accounts. */
export async function findEmailAccount(database: Pool, email: string) {
  const result = await database.query<{ id: string; email: string }>(
    `SELECT id,email FROM handa_auth_user WHERE lower(email)=ANY($1::text[])
     ORDER BY (lower(email)=$2) DESC,"createdAt",id LIMIT 1`,
    [emailAddressAliases(email), email.trim().toLowerCase()],
  );
  return result.rows[0] ?? null;
}

export async function resolveGoogleEmail(database: Pool, profile: { sub: string; email: string; email_verified: boolean }): Promise<string> {
  // Never use an unverified provider email to link another local account.
  if (!profile.email_verified) return profile.email;
  const linked = await database.query<{ email: string }>(
    `SELECT u.email FROM handa_auth_user u JOIN handa_auth_account a ON a."userId"=u.id
     WHERE a."providerId"='google' AND a."accountId"=$1 LIMIT 1`, [profile.sub],
  );
  return linked.rows[0]?.email ?? (await findEmailAccount(database, profile.email))?.email ?? normalizeEmailAddress(profile.email);
}
