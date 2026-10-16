import { getDatabaseContent } from "./content/source";
import "server-only";
import { storyRecords } from "@/data/stories";
import type { EventStory } from "@/types/story";

// sample 또는 database 모드에서 조회하며 초안은 공개 화면에 반환하지 않습니다.
export async function getPublishedStories(): Promise<EventStory[]> {
  const database = await getDatabaseContent("story");
  if (database !== null) return database.sort((a, b) => b.eventDate.localeCompare(a.eventDate) || a.slug.localeCompare(b.slug));
  return storyRecords.filter((story) => story.status === "published")
    .map(({ status, ...story }) => { void status; return story; })
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate));
}

export async function getPublishedStory(slug: string): Promise<EventStory | null> {
  return (await getPublishedStories()).find((story) => story.slug === slug) ?? null;
}

export function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeZone: "Europe/Berlin" })
    .format(new Date(`${value}T12:00:00Z`));
}
