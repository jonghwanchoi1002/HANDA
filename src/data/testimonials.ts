import type { Testimonial } from "@/types/testimonial";

type TestimonialRecord = Testimonial & {
  status: "draft" | "published";
  publicationConsent: boolean;
  sortOrder: number;
};

// 실제 참가자의 발언이 아닌 화면 개발용 가상 문구입니다.
export const testimonialRecords: TestimonialRecord[] = [
  {
    id: "sample-connection", name: "예시 참가자 A", introduction: "창업을 준비하는 사람 · 가상 프로필",
    quote: "혼자 생각하던 질문을 함께 나누는 것만으로도 다음에 무엇을 해볼지 조금 더 선명해졌어요.",
    topic: "연결", photo: null, isExample: true, status: "published", publicationConsent: false, sortOrder: 1,
  },
  {
    id: "sample-learning", name: "예시 참가자 B", introduction: "사업을 운영하는 사람 · 가상 프로필",
    quote: "서로 다른 경험을 듣다 보면, 내 일에도 적용해볼 수 있는 작은 힌트를 발견하게 됩니다.",
    topic: "배움", photo: null, isExample: true, status: "published", publicationConsent: false, sortOrder: 2,
  },
  {
    id: "sample-growth", name: "예시 참가자 C", introduction: "새로운 도전을 시작하는 사람 · 가상 프로필",
    quote: "결과뿐 아니라 과정의 고민도 편하게 나눌 수 있는 동료를 만나는 공간이면 좋겠어요.",
    topic: "성장", photo: null, isExample: true, status: "published", publicationConsent: false, sortOrder: 3,
  },
];
