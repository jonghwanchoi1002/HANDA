import "server-only";
import { put, get, del } from "@vercel/blob";
import type { ImageStore } from "./media";
export const blobStore:ImageStore={
  async put(pathname,bytes) {const blob=await put(pathname,bytes,{access:"private",contentType:"image/webp",addRandomSuffix:false,abortSignal:AbortSignal.timeout(15000)});return blob.url;},
  async remove(pathname){await del(pathname);},
  async get(pathname){const result=await get(pathname,{access:"private",abortSignal:AbortSignal.timeout(15000)});return result?.statusCode===200?result.stream:null;},
};
