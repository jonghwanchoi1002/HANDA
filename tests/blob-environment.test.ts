import assert from "node:assert/strict";
import { test } from "node:test";
import { selectBlobToken } from "../src/lib/content/blob-environment";
test("Production and pre-production select isolated Blob credentials without cross-environment fallback",()=>{
 const credentials={BLOB_READ_WRITE_TOKEN:"test-only-dev",BLOB_PROD_READ_WRITE_TOKEN:"test-only-prod"};
 assert.equal(selectBlobToken({...credentials,VERCEL_ENV:"production"}),"test-only-prod");
 for(const environment of [undefined,"preview","development"])assert.equal(selectBlobToken({...credentials,VERCEL_ENV:environment}),"test-only-dev");
 assert.equal(selectBlobToken({VERCEL_ENV:"production",BLOB_READ_WRITE_TOKEN:"test-only-dev"}),undefined);
 assert.equal(selectBlobToken({VERCEL_ENV:"preview",BLOB_PROD_READ_WRITE_TOKEN:"test-only-prod"}),undefined);
 assert.equal(selectBlobToken({BLOB_READ_WRITE_TOKEN:"  "}),undefined);
});
