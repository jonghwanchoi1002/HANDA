import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { canReadWiki, canManageMembers } from "@/lib/auth/permissions";
import SignOut from "./sign-out";
export default async function AccountMenu() {
  const user=await getCurrentUser();
  if(!user)return <Link href="/login" prefetch={false}>로그인 / 회원가입</Link>;
  return <><Link href="/account" prefetch={false}>내 계정</Link>{canReadWiki(user)&&<Link href="/account/posts" prefetch={false}>내가 쓴 글</Link>}{canManageMembers(user)&&<><Link href="/admin/content" prefetch={false}>콘텐츠 관리</Link><Link href="/admin/members" prefetch={false}>회원 관리</Link></>}<SignOut plain /></>;
}
