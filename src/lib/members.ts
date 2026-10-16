import { getDatabaseContent } from "./content/source";
import "server-only";
import { memberRecords } from "@/data/members";
import type { MemberProfile } from "@/types/member";

// sample 또는 database 모드에서 공개 프로필을 조회합니다.
// 공개 화면에는 공개 상태인 프로필만 반환하며 관리용 필드는 제외합니다.
export async function getPublishedMembers(): Promise<MemberProfile[]> {
  const database = await getDatabaseContent("member");
  if (database !== null) return database;
  return memberRecords.filter((member) => member.status === "published")
    .map(({ status, ...profile }) => { void status; return profile; });
}

export async function getPublishedMember(slug: string): Promise<MemberProfile | null> {
  const members = await getPublishedMembers();
  return members.find((member) => member.slug === slug) ?? null;
}
