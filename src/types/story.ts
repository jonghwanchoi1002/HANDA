import type { ContentMap } from "@/lib/content/schema";
export type EventStory=ContentMap["story"];
export type StoryBlock=EventStory["blocks"][number];
export type StoryImage=NonNullable<EventStory["cover"]>;
