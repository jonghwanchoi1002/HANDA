import type { Metadata } from "next";
import { getPublicPage } from "@/lib/pages";
import PageContent from "../page-content";
export const instant=false;
export const metadata:Metadata={title:"운영 방식 및 참여 안내 | HANDA"};
export default async function Page(){
  return <PageContent page={await getPublicPage("guide")} eyebrow="HOW HANDA WORKS"/>;
}
