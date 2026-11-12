import type { Testimonial } from "@/types/testimonial";

type TestimonialRecord = Omit<Testimonial,"closingTitle"|"closingBody"|"joinLabel"|"joinUrl"> & {
  status: "draft" | "published";
  publicationConsent: boolean;
  sortOrder: number;
};

// 실제 참가자의 발언이 아닌 화면 개발용 가상 문구입니다.
export const testimonialRecords: TestimonialRecord[] = [
  {
    id: "sample-connection", name: "예시 참가자 A", introduction: "창업을 준비하는 사람 · 가상 프로필",
    quote: "혼자 생각하던 질문을 함께 나누는 것만으로도 다음에 무엇을 해볼지 조금 더 선명해졌어요.",
    sections: [
      {number:"01",title:"HANDA에 오기 전에는",paragraphs:["사업을 준비하며 생긴 질문을 누구와 나눌 수 있을지 고민했습니다."],highlight:false},
      {number:"02",title:"참여한 이후의 변화",paragraphs:["서로의 실행을 듣고 다음 달에 해볼 작은 목표를 정할 수 있었습니다."],highlight:false},
      {number:"03",title:"가장 도움이 된 부분",paragraphs:["다른 창업자들의 경험과 인사이트"],highlight:true},
    ],
    topic: "연결", photo: null, isExample: true, status: "published", publicationConsent: false, sortOrder: 1,
  },
  {
    id: "sample-learning", name: "예시 참가자 B", introduction: "사업을 운영하는 사람 · 가상 프로필",
    quote: "서로 다른 경험을 듣다 보면, 내 일에도 적용해볼 수 있는 작은 힌트를 발견하게 됩니다.",
    sections: [{number:"",title:"함께 배우는 시간",paragraphs:["모임에서 들은 다양한 운영 경험을 제 사업에 적용해 볼 아이디어로 정리했습니다."],highlight:false}],
    topic: "배움", photo: null, isExample: true, status: "published", publicationConsent: false, sortOrder: 2,
  },
  {
    id: "sample-growth", name: "예시 참가자 C", introduction: "새로운 도전을 시작하는 사람 · 가상 프로필",
    quote: "결과뿐 아니라 과정의 고민도 편하게 나눌 수 있는 동료를 만나는 공간이면 좋겠어요.",
    sections: [{number:"",title:"다음 실행을 향해",paragraphs:["실행 과정의 어려움을 솔직하게 나누고 다음 걸음을 함께 고민할 수 있었습니다."],highlight:false}],
    topic: "성장", photo: null, isExample: true, status: "published", publicationConsent: false, sortOrder: 3,
  },
];
