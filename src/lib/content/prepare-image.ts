"use client";
import { MAX_SOURCE_IMAGE_BYTES, MAX_UPLOAD_IMAGE_BYTES, MAX_IMAGE_EDGE_LENGTH } from "./image-limits";

type DecodedImage={source:CanvasImageSource;width:number;height:number;release:()=>void};
async function decodeImage(file:File):Promise<DecodedImage>{
  if(typeof createImageBitmap==="function"){
    try{const bitmap=await createImageBitmap(file,{imageOrientation:"from-image"});return{source:bitmap,width:bitmap.width,height:bitmap.height,release:()=>bitmap.close()};}catch{/* 지원하지 않는 브라우저는 이미지 요소로 다시 시도합니다. */}
  }
  const url=URL.createObjectURL(file);
  try{
    const image=await new Promise<HTMLImageElement>((resolve,reject)=>{const element=new Image();element.onload=()=>resolve(element);element.onerror=()=>reject(new Error());element.src=url;});
    return{source:image,width:image.naturalWidth,height:image.naturalHeight,release:()=>URL.revokeObjectURL(url)};
  }catch{URL.revokeObjectURL(url);throw new Error("JPG, PNG, WebP 사진 파일을 선택해 주세요.");}
}
function encode(canvas:HTMLCanvasElement,type:string,quality:number):Promise<Blob>{
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("사진을 처리하지 못했습니다. 다른 사진을 선택해 주세요.")),type,quality));
}
export async function prepareImageUpload(file:File):Promise<File>{
  if(file.size>MAX_SOURCE_IMAGE_BYTES)throw new Error("사진은 한 장에 15MB 이하로 첨부해 주세요.");
  if(!file.size)throw new Error("사진 파일을 선택해 주세요.");
  if(file.type&&!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error("JPG, PNG, WebP 사진 파일을 선택해 주세요.");
  const image=await decodeImage(file);let canvas:HTMLCanvasElement|undefined;
  try{
    if(!image.width||!image.height)throw new Error("사진을 읽지 못했습니다. 다른 사진을 선택해 주세요.");
    if(file.size<=MAX_UPLOAD_IMAGE_BYTES&&Math.max(image.width,image.height)<=MAX_IMAGE_EDGE_LENGTH)return file;
    canvas=document.createElement("canvas");
    const ratio=Math.min(1,MAX_IMAGE_EDGE_LENGTH/Math.max(image.width,image.height));
    let type="image/webp";
    for(const reduction of [1,0.75,0.5]){
      canvas.width=Math.max(1,Math.round(image.width*ratio*reduction));canvas.height=Math.max(1,Math.round(image.height*ratio*reduction));
      const context=canvas.getContext("2d");if(!context)throw new Error("이 브라우저에서 사진을 처리하지 못했습니다. 다른 브라우저로 시도해 주세요.");
      if(type==="image/jpeg"){context.fillStyle="#fff";context.fillRect(0,0,canvas.width,canvas.height);}
      context.drawImage(image.source,0,0,canvas.width,canvas.height);
      for(const quality of [0.9,0.8,0.7,0.6]){
        let blob=await encode(canvas,type,quality);
        if(type==="image/webp"&&blob.type!=="image/webp"){
          // WebP 인코딩을 지원하지 않으면 JPEG로 변환합니다. 투명 영역은 흰색으로 처리합니다.
          type="image/jpeg";context.globalCompositeOperation="destination-over";context.fillStyle="#fff";context.fillRect(0,0,canvas.width,canvas.height);context.globalCompositeOperation="source-over";
          blob=await encode(canvas,type,quality);
        }
        if(blob.size<=MAX_UPLOAD_IMAGE_BYTES){const name=file.name.replace(/\.[^.]*$/,"")||"photo";return new File([blob],`${name}.${blob.type==="image/webp"?"webp":"jpg"}`,{type:blob.type});}
      }
    }
    throw new Error("사진 용량을 충분히 줄이지 못했습니다. 크기를 줄인 뒤 다시 선택해 주세요.");
  }finally{image.release();if(canvas){canvas.width=0;canvas.height=0;}}
}
