import { getCurrentUser } from "@/lib/auth/session";
import { getApprovalNotice } from "@/lib/auth/account-profile";
import { getDatabase } from "@/lib/content/database";
export async function GET(){
  const headers={"Cache-Control":"private, no-store",Vary:"Cookie"};
  const user=await getCurrentUser();if(!user)return Response.json({version:null},{status:401,headers});
  return Response.json({version:await getApprovalNotice(getDatabase(),user.id)},{headers});
}
