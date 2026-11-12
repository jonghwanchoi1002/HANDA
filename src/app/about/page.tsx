import type { Metadata } from "next";
import { getPublicPage } from "@/lib/pages";
import PageContent from "./page-content";
export const instant=false;
export const metadata:Metadata={title:"HANDA란? | HANDA"};
export default async function Page(){
  return <PageContent page={await getPublicPage("about")} eyebrow="ABOUT HANDA"/>;
}
