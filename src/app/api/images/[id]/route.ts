import { getCurrentUser } from "@/lib/auth/session";
import { getDatabase } from "@/lib/content/database";
import { blobStore } from "@/lib/content/blob-store";
import { readImage, MediaError } from "@/lib/content/media";
const headers={"Cache-Control":"private, no-store",Vary:"Cookie","X-Content-Type-Options":"nosniff"};
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    const user=await getCurrentUser();
    const stream=await readImage(getDatabase(),blobStore,(await params).id,user);
    return new Response(stream,{headers:{...headers,"Content-Type":"image/webp","Content-Disposition":"inline"}});
  }catch(error){if(!(error instanceof MediaError))console.error("Image read failed.");return new Response(null,{status:error instanceof MediaError?error.status:503,headers});}
}
