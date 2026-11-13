import { testimonialClosingDefaults } from "./testimonial-defaults";
import type { ContentKind } from "./schema";
export type Field = { key: string; label: string; type?: "text" | "long" | "lines" | "date" | "url"; optional?: boolean; rich?:boolean };
export const editorFields: Record<ContentKind, Field[]> = {
  home: [{key:"heroTitle",label:"메인 첫 줄"},{key:"heroSubtitle",label:"메인 둘째 줄"},{key:"heroHighlight",label:"메인 강조 문구"},{key:"heroDescription",label:"메인 설명",type:"lines"},{key:"aboutTitle",label:"About 소개 제목",type:"lines"},{key:"aboutLead",label:"About 보충 요약",type:"lines",optional:true},{key:"aboutDescription",label:"About 보충 본문",type:"long",optional:true},
    {key:"aboutValue1Title",label:"About 01 제목"},{key:"aboutValue1Description",label:"About 01 설명",type:"long"},
    {key:"aboutValue2Title",label:"About 02 제목"},{key:"aboutValue2Description",label:"About 02 설명",type:"long"},
    {key:"aboutValue3Title",label:"About 03 제목"},{key:"aboutValue3Description",label:"About 03 설명",type:"long"}],
  page: [{key:"title",label:"페이지 제목"},{key:"heading",label:"본문 제목"},{key:"body",label:"본문",type:"long"},{key:"secondaryHeading",label:"추가 안내 제목",optional:true},{key:"secondaryBody",label:"추가 안내 내용",type:"long",optional:true},{key:"ctaLabel",label:"참여 신청 버튼 문구"},{key:"ctaUrl",label:"참여 신청 링크",type:"url"}],
  wiki: [{key:"title",label:"제목"},{key:"category",label:"분류"},{key:"summary",label:"요약",type:"long"}],
  member: [{key:"name",label:"이름"},{key:"field",label:"사업 분야"},{key:"role",label:"직함"},{key:"summary",label:"한 줄 소개",type:"long"},{key:"introduction",label:"소개 본문",type:"lines"},{key:"interests",label:"관심 분야",type:"lines",optional:true}],
  story: [{key:"title",label:"제목"},{key:"summary",label:"요약",type:"long"},{key:"eventDate",label:"모임 날짜",type:"date"},{key:"location",label:"장소"}],
  testimonial: [{key:"name",label:"이름"},{key:"introduction",label:"참가자 소개"},{key:"quote",label:"한 줄 후기",type:"long"},{key:"topic",label:"주제"},{key:"closingTitle",label:"마무리 안내 제목",optional:true},{key:"closingBody",label:"마무리 안내 내용",type:"long",optional:true},{key:"joinLabel",label:"참여 버튼 문구",optional:true},{key:"joinUrl",label:"참여 신청 링크",type:"url",optional:true}],
};
for(const fields of Object.values(editorFields))for(const field of fields){
  field.rich=field.type!=="url"&&field.type!=="date"&&!["category","location","interests","ctaLabel","joinLabel"].includes(field.key);
}
export function emptyPayload(kind: ContentKind, key: string): Record<string, unknown> {
  const payload: Record<string, unknown> = {isExample:false};
  for (const field of editorFields[kind]) payload[field.key] = field.type === "lines" ? [] : "";
  if (kind === "home") delete payload.isExample;
  else if (kind === "testimonial") Object.assign(payload,{id:key,photo:null,sections:[{number:"",title:"",paragraphs:[],highlight:false}],...testimonialClosingDefaults});
  else payload.slug=key;
  if (kind === "wiki") payload.sections=[{title:"",paragraphs:[]}];
  if (kind === "member") Object.assign(payload,{website:null,websites:[],cohorts:[],photoUrl:null});
  if (kind === "story") Object.assign(payload,{cover:null,blocks:[{id:"paragraph-1",type:"paragraph",text:""}]});
  return payload;
}
