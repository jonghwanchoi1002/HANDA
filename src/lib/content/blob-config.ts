import "server-only";
import { selectBlobToken } from "./blob-environment";
export function getBlobToken(){return selectBlobToken({VERCEL_ENV:process.env.VERCEL_ENV,BLOB_READ_WRITE_TOKEN:process.env.BLOB_READ_WRITE_TOKEN,BLOB_PROD_READ_WRITE_TOKEN:process.env.BLOB_PROD_READ_WRITE_TOKEN});}
export function requireBlobToken(){
  const token=getBlobToken();if(!token)throw new Error("Blob credentials are not configured for this environment.");
  return token;
}
