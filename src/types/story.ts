export type StoryImage = {
  id: string;
  url: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

// 본문은 순서가 있는 블록으로 보관해 문단 사이에 사진을 배치합니다.
export type StoryBlock =
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "image"; image: StoryImage };

export type EventStory = {
  slug: string;
  title: string;
  summary: string;
  eventDate: string;
  location: string;
  cover: StoryImage | null;
  blocks: StoryBlock[];
  isExample: boolean;
};
