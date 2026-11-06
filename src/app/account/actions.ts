"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDatabase } from "@/lib/content/database";
import { acknowledgeApprovalNotice, updateProfileVisibility, AccountProfileError } from "@/lib/auth/account-profile";
export async function confirmApproval(version:number):Promise<{ok:boolean;message?:string}>{
  const user=await getCurrentUser();if(!user)redirect("/login");
  try{await acknowledgeApprovalNotice(getDatabase(),user.id,version);}
  catch(error){return {ok:false,message:error instanceof AccountProfileError?error.message:"확인 내용을 저장하지 못했습니다. 다시 시도해 주세요."};}
  revalidatePath("/","layout");return {ok:true};
}

export async function saveProfileVisibility(_previous:{message:string;success:boolean},form:FormData):Promise<{message:string;success:boolean}>{
  const user=await getCurrentUser();if(!user)redirect("/login");
  try{await updateProfileVisibility(getDatabase(),user.id,form.get("visibility"));}
  catch(error){return {success:false,message:error instanceof AccountProfileError?error.message:"공개 범위를 저장하지 못했습니다. 다시 시도해 주세요."};}
  revalidatePath("/account");return {success:true,message:"공개 범위를 저장했습니다."};
}
