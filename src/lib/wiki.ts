import "server-only";
import { wikiArticles } from "@/data/wiki";
import { getDatabaseContent } from "./content/source";
import type { WikiArticle } from "@/types/wiki";

export async function getPublishedWikiArticles(): Promise<WikiArticle[]> {
  return (await getDatabaseContent("wiki")) ?? wikiArticles;
}
export async function getPublishedWikiArticle(slug: string): Promise<WikiArticle | null> {
  const database = await getDatabaseContent("wiki", slug);
  return database ? database[0] ?? null : wikiArticles.find((article) => article.slug === slug) ?? null;
}
