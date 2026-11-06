import type { ContentMap } from "@/lib/content/schema";
import { homeAboutDefaults } from "@/lib/content/home-defaults";

export const homeContent: ContentMap["home"] = {
  heroTitle: "혼자 고민하던 일을,", heroSubtitle: "함께 풀어가는", heroHighlight: "곳.",
  heroDescription: ["낯선 환경에서 시작하는 창업. 경험을 나눌 동료가 있다면 달라집니다."],
  aboutTitle: ["베를린에서 창업을 꿈꾸는 사람들이 연결되는 커뮤니티."],
  aboutLead: [], aboutDescription: "",
  ...homeAboutDefaults,
};
