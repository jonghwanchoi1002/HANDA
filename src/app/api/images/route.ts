import { getCurrentUser } from "@/lib/auth/session";
import { canReadWiki } from "@/lib/auth/permissions";
import { getDatabase } from "@/lib/content/database";
import { blobStore } from "@/lib/content/blob-store";
import { uploadImage, MediaError, MAX_IMAGE_BYTES } from "@/lib/content/media";
export async function POST(request:Request) {
  if(request.headers.get("origin")!==new URL(request.url).origin)return Response.json({message:"요청한 사이트를 확인해 주세요."},{status:403});
  const user=await getCurrentUser();if(!canReadWiki(user))return Response.json({message:"승인된 회원만 사진을 첨부할 수 있습니다."},{status:403});
  if(!process.env.BLOB_READ_WRITE_TOKEN||process.env.CONTENT_SOURCE!=="database")return Response.json({message:"사진 저장소를 준비 중입니다."},{status:503});
  try {
    const limit=MAX_IMAGE_BYTES+65536;
    if(Number(request.headers.get("content-length"))>limit)throw new MediaError("사진은 한 장에 3MB 이하로 첨부해 주세요.",413);
    const reader=request.body?.getReader();if(!reader)throw new MediaError("사진 파일을 선택해 주세요.");
    const parts:Uint8Array[]=[];let size=0;
    try {while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>limit){await reader.cancel();throw new MediaError("사진은 한 장에 3MB 이하로 첨부해 주세요.",413);}parts.push(chunk.value);}}finally{reader.releaseLock();}
    const form=await new Response(new Uint8Array(Buffer.concat(parts)),{headers:{"content-type":request.headers.get("content-type") ?? ""}}).formData();
    const file=form.get("file");if(!(file instanceof File))throw new MediaError("사진 파일을 선택해 주세요.");
    const photo=await uploadImage(getDatabase(),blobStore,user!.id,{kind:String(form.get("kind")),key:String(form.get("key")),alt:String(form.get("alt") ?? ""),bytes:Buffer.from(await file.arrayBuffer())});
    return Response.json(photo,{status:201,headers:{"Cache-Control":"no-store"}});
  }catch(error){if(error instanceof MediaError)return Response.json({message:error.message},{status:error.status});console.error("Image upload failed. Check private Blob storage and database configuration.");return Response.json({message:"사진을 첨부하지 못했습니다. 잠시 후 다시 시도해 주세요."},{status:500});}
}
