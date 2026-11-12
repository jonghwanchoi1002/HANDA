import "server-only";
import { pageContent } from "@/data/pages";
import { getDatabaseContent } from "./content/source";
export async function getPublicPage(slug:"about"|"guide"|"join"){
  const rows=await getDatabaseContent("page",slug);
  // Only explicit sample mode uses local placeholders; DB errors/missing rows never fall back.
  if(rows===null)return pageContent.find(page=>page.slug===slug)!;
  if(!rows[0])throw new Error("Introduction page is missing. Apply the page migration first.");
  return rows[0];
}
