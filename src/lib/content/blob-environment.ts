type BlobEnvironment={VERCEL_ENV?:string;BLOB_READ_WRITE_TOKEN?:string;BLOB_PROD_READ_WRITE_TOKEN?:string};
// Preview/PC는 개발용 토큰만, Vercel Production은 운영용 토큰만 사용합니다.
export function selectBlobToken(environment:BlobEnvironment):string|undefined {
  const value=environment.VERCEL_ENV==="production"?environment.BLOB_PROD_READ_WRITE_TOKEN:environment.BLOB_READ_WRITE_TOKEN;
  return value?.trim()||undefined;
}
