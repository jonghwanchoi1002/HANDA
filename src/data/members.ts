import type { MemberProfile } from "@/types/member";

type MemberRecord = MemberProfile & { status: "draft" | "published" };

// 실제 인물·회사가 아닌 화면 개발용 예시입니다.
export const memberRecords: MemberRecord[] = [
  {
    slug: "sample-digital-founder", name: "예시 멤버 A", field: "디지털 서비스", role: "제품을 만드는 창업자",
    summary: "작은 아이디어를 실제로 쓸 수 있는 서비스로 만드는 과정에 관심이 있습니다.",
    introduction: ["디지털 제품과 서비스 기획 분야의 소개가 어떻게 보이는지 보여주는 예시 프로필입니다.", "실제 멤버 소개에는 창업 배경과 현재 하는 일, 함께 나누고 싶은 경험을 담을 수 있습니다."],
    interests: ["제품 기획", "고객 인터뷰", "서비스 개발"], website: null, photoUrl: null, isExample: true, status: "published",
  },
  {
    slug: "sample-local-founder", name: "예시 멤버 B", field: "로컬 비즈니스", role: "일상 속 경험을 만드는 창업자",
    summary: "지역의 사람들과 연결되는 공간과 지속 가능한 운영을 고민합니다.",
    introduction: ["로컬 비즈니스와 공간 운영 분야를 소개하기 위한 예시 프로필입니다.", "실제 소개에서는 사업의 이야기와 운영하면서 배운 점, 교류하고 싶은 주제를 자유롭게 나눌 수 있습니다."],
    interests: ["공간 운영", "지역 커뮤니티", "고객 경험"], website: null, photoUrl: null, isExample: true, status: "published",
  },
  {
    slug: "sample-creative-founder", name: "예시 멤버 C", field: "크리에이티브", role: "브랜드의 이야기를 만드는 창업자",
    summary: "디자인과 콘텐츠로 브랜드의 가치를 전하는 방법을 탐구합니다.",
    introduction: ["디자인과 콘텐츠 분야의 멤버 소개를 보여주는 예시 프로필입니다.", "앞으로 실제 멤버의 작업, 전문 분야와 협업 관심사를 이 공간에 담을 예정입니다."],
    interests: ["브랜드 디자인", "콘텐츠", "협업"], website: null, photoUrl: null, isExample: true, status: "published",
  },
];
