/** 공개 페이지에 전달하는 참가자 이야기 형식입니다. */
export type Testimonial = {
  id: string;
  name: string;
  introduction: string;
  quote: string;
  topic: string;
  photo: { url: string; alt: string; width: number; height: number } | null;
  isExample: boolean;
};
