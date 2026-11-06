import "server-only";
import { requireBlobToken } from "./blob-config";
import { put, get, del } from "@vercel/blob";
import type { ImageStore } from "./media";
export const blobStore:ImageStore={
  async put(pathname,bytes) {const blob=await put(pathname,bytes,{token:requireBlobToken(),access:"private",contentType:"image/webp",addRandomSuffix:false,abortSignal:AbortSignal.timeout(15000)});return blob.url;},
  async remove(pathname){await del(pathname,{token:requireBlobToken()});},
  async get(pathname){const result=await get(pathname,{token:requireBlobToken(),access:"private",abortSignal:AbortSignal.timeout(15000)});return result?.statusCode===200?result.stream:null;},
};
