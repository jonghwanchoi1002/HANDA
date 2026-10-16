import "server-only";
import { memberRecords } from "@/data/members";
import type { MemberProfile } from "@/types/member";

// Neon 연결 시 이 조회 함수 내부를 DB 쿼리로 교체합니다.
// 공개 화면에는 공개 상태인 프로필만 반환하며 관리용 필드는 제외합니다.
export async function getPublishedMembers(): Promise<MemberProfile[]> {
  return memberRecords.filter((member) => member.status === "published")
    .map(({ status, ...profile }) => { void status; return profile; });
}

export async function getPublishedMember(slug: string): Promise<MemberProfile | null> {
  const members = await getPublishedMembers();
  return members.find((member) => member.slug === slug) ?? null;
}
