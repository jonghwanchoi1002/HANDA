import "server-only";
import { requireWikiMember } from "@/lib/auth/session";
import { wikiArticles } from "@/data/wiki";
import { getDatabaseContent } from "./content/source";
import type { WikiArticle } from "@/types/wiki";

export async function getPublishedWikiArticles(): Promise<WikiArticle[]> {
  await requireWikiMember();
  return (await getDatabaseContent("wiki")) ?? wikiArticles;
}
export async function getPublishedWikiArticle(slug: string): Promise<WikiArticle | null> {
  await requireWikiMember();
  const database = await getDatabaseContent("wiki", slug);
  return database ? database[0] ?? null : wikiArticles.find((article) => article.slug === slug) ?? null;
}
