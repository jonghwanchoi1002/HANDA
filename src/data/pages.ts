import type { ContentMap } from "@/lib/content/schema";

// Sample mode and first-time initialization only. Published content comes from the DB.
const defaults = {
  isExample: false as const,
  secondaryHeading: "",
  secondaryBody: "",
  ctaLabel: "HANDA 참여 신청하기",
  ctaUrl: "https://forms.gle/SXXxb8321efoPFta8",
};

export const pageContent: ContentMap["page"][] = [
  {
    ...defaults, slug: "about", title: "HANDA란?",
    heading: "HANDA를 소개합니다.",
    body: "커뮤니티 소개 내용을 준비하고 있습니다.",
  },
  {
    ...defaults, slug: "guide", title: "운영 방식 및 참여 안내",
    heading: "함께하는 방법을 안내해 드릴게요.",
    body: "운영 방식과 참여 안내 내용을 준비하고 있습니다.",
  },
  {
    ...defaults, slug: "join", title: "HANDA에 참여하고 싶으신가요?",
    heading: "참여 신청 안내",
    body: "HANDA는 각자의 사업을 실행하며 얻은 경험과 고민을 나누고, 서로의 성장을 돕는 창업자 커뮤니티입니다.",
    secondaryHeading: "아직 참여를 고민 중이신가요?",
    secondaryBody: "다음 기수 모집이 시작되면 안내받을 수 있어요.",
  },
];
