import { z } from "zod";
import { canReadWiki, type Membership } from "./permissions";
export const profileVisibilitySchema=z.enum(["private","members","public"]);
export type ProfileVisibility=z.infer<typeof profileVisibilitySchema>;
export const profileVisibilityLabels:Record<ProfileVisibility,string>={private:"비공개",members:"멤버에게만",public:"모든 방문객"};
// 향후 회원 프로필 조회에서 사용할 정책입니다. 로그인 이메일·비밀번호를 공개하는 용도로 사용하지 않습니다.
export function canViewMemberProfile(owner:Membership&{id:string;profileVisibility:ProfileVisibility},viewer:(Membership&{id:string})|null):boolean {
  if(viewer?.id===owner.id)return true;
  if(!canReadWiki(owner))return false;
  if(owner.profileVisibility==="public")return true;
  return owner.profileVisibility==="members"&&canReadWiki(viewer);
}
