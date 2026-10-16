import type { EventStory } from "@/types/story";

type StoryRecord = EventStory & { status: "draft" | "published" };

// 실제로 열린 모임의 기록이 아닌, 화면 개발용 예시입니다.
export const storyRecords: StoryRecord[] = [
  {
    slug: "sample-founders-conversation", title: "시작하는 사람들의 첫 대화", summary: "각자의 아이디어와 고민을 나누는 모임 후기는 어떤 모습일까요?",
    eventDate: "2026-09-19", location: "베를린 · 예시 장소", cover: null, isExample: true, status: "published",
    blocks: [
      { id: "intro", type: "paragraph", text: "이 글은 실제 행사 후기가 아닌 예시입니다. 앞으로 모임에서 나눈 이야기와 사진을 이 공간에 기록할 예정입니다." },
      { id: "heading", type: "heading", text: "서로의 시작을 듣는 시간" },
      { id: "conversation", type: "paragraph", text: "실제 후기에는 모임을 연 이유와 함께 이야기한 주제, 기억에 남는 질문을 적을 수 있습니다. 참가자의 이야기를 인용할 때는 공개에 동의한 내용만 담습니다." },
      { id: "next", type: "heading", text: "다음 만남으로 이어갈 이야기" },
      { id: "closing", type: "paragraph", text: "모임에서 배운 점과 다음에 함께 고민하고 싶은 주제를 정리합니다. 사진은 문단 사이에 여러 장 배치하고, 사진마다 설명을 덧붙일 수 있도록 구성했습니다." },
    ],
  },
  {
    slug: "sample-knowledge-sharing", title: "작은 노하우를 함께 나누는 시간", summary: "사업 운영에서 배운 경험을 정리하는 모임 기록의 예시입니다.",
    eventDate: "2026-09-05", location: "베를린 · 예시 장소", cover: null, isExample: true, status: "published",
    blocks: [
      { id: "intro", type: "paragraph", text: "모임 후기의 구성을 보여주기 위한 예시 글입니다. 날짜와 장소도 실제 행사 정보가 아닙니다." },
      { id: "heading", type: "heading", text: "작은 경험도 누군가에게는 힌트" },
      { id: "learning", type: "paragraph", text: "고객과의 소통, 업무 정리, 협업 등 모임에서 실제로 다룬 주제를 여기에 담을 수 있습니다. 관련 위키 글이 있다면 이후 연결해 경험과 지식을 함께 찾아볼 수 있도록 발전시킬 예정입니다." },
    ],
  },
];
