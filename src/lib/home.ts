import "server-only";
import { homeContent } from "@/data/home";
import { getDatabaseContent } from "./content/source";

export async function getHomeContent() {
  const database = await getDatabaseContent("home", "homepage");
  if (database === null) return homeContent;
  if (!database[0]) throw new Error("Published homepage content is missing. Initialize the database first.");
  return database[0];
}
