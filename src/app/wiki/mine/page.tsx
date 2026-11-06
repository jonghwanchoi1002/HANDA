import { redirect } from "next/navigation";
export const instant=false;
export default async function OldMyWiki({searchParams}:{searchParams:Promise<{page?:string}>}) {
  const {page}=await searchParams;
  redirect(page?`/account/posts?page=${encodeURIComponent(page)}`:"/account/posts");
}
