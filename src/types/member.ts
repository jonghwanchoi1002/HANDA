/** 목록과 상세 화면이 사용하는 공개 프로필 형식입니다. */
export type MemberProfile = {
  slug: string;
  name: string;
  field: string;
  role: string;
  summary: string;
  introduction: string[];
  interests: string[];
  website: string | null;
  photoUrl: string | null;
  isExample: boolean;
};
