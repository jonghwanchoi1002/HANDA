// 원본 선택 한도와 서버 전송 한도는 다릅니다. 전송 한도는 Vercel 요청 제한보다 작게 유지합니다.
export const MAX_SOURCE_IMAGE_BYTES=15*1024*1024;
export const MAX_UPLOAD_IMAGE_BYTES=3*1024*1024;
export const MAX_IMAGE_EDGE_LENGTH=2400;
