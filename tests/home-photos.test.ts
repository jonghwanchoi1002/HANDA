import assert from "node:assert/strict";
import { test } from "node:test";
import { homeContent } from "../src/data/home";
import { parseContent } from "../src/lib/content/schema";
import { defaultHomePhoto, selectHomePhoto } from "../src/lib/content/home-photos";
import { imageURLs } from "../src/lib/content/media-access";

test("legacy and empty homes use the original photo; fixed and random settings select only registered photos",()=>{
  assert.deepEqual(selectHomePhoto(homeContent),defaultHomePhoto);
  assert.deepEqual(selectHomePhoto({...homeContent,heroPhotos:[],heroPhotoMode:"random"}),defaultHomePhoto);
  const photos=[defaultHomePhoto,{...defaultHomePhoto,url:"/brand/second.jpg",alt:"두 번째 사진"}];
  const home=parseContent("home",{...homeContent,heroPhotos:photos,heroPhotoMode:"fixed",heroPhotoUrl:photos[1].url});
  assert.deepEqual(selectHomePhoto(home),photos[1]);
  assert.deepEqual(selectHomePhoto({...home,heroPhotoUrl:"/removed.jpg"}),photos[0]);
  assert.deepEqual(selectHomePhoto({...home,heroPhotoMode:"random"},()=>0),photos[0]);
  assert.deepEqual(selectHomePhoto({...home,heroPhotoMode:"random"},()=>0.999),photos[1]);
  assert.deepEqual(imageURLs(home),photos.map(photo=>photo.url));
  assert.throws(()=>parseContent("home",{...home,heroPhotos:Array(11).fill(photos[0])}));
  assert.throws(()=>parseContent("home",{...home,heroPhotos:[{...photos[0],url:"javascript:alert(1)"}]}));
  assert.throws(()=>parseContent("home",{...home,heroPhotoMode:"invalid"}));
});
