import type { ContentKind } from "./schema";
export type Field = { key: string; label: string; type?: "text" | "long" | "lines" | "date" | "url"; optional?: boolean };
export const editorFields: Record<ContentKind, Field[]> = {
  home: [{key:"heroTitle",label:"메인 첫 줄"},{key:"heroSubtitle",label:"메인 둘째 줄"},{key:"heroHighlight",label:"메인 강조 문구"},{key:"heroDescription",label:"메인 설명",type:"lines"},{key:"aboutTitle",label:"소개 제목",type:"lines"},{key:"aboutLead",label:"소개 요약",type:"lines"},{key:"aboutDescription",label:"소개 본문",type:"long"}],
  wiki: [{key:"title",label:"제목"},{key:"category",label:"분류"},{key:"summary",label:"요약",type:"long"}],
  member: [{key:"name",label:"이름"},{key:"field",label:"사업 분야"},{key:"role",label:"직함"},{key:"summary",label:"한 줄 소개",type:"long"},{key:"introduction",label:"소개 본문",type:"lines"},{key:"interests",label:"관심 분야",type:"lines",optional:true},{key:"website",label:"웹사이트",type:"url",optional:true}],
  story: [{key:"title",label:"제목"},{key:"summary",label:"요약",type:"long"},{key:"eventDate",label:"모임 날짜",type:"date"},{key:"location",label:"장소"}],
  testimonial: [{key:"name",label:"이름"},{key:"introduction",label:"참가자 소개"},{key:"quote",label:"참가자 이야기",type:"long"},{key:"topic",label:"주제"}],
};
export function emptyPayload(kind: ContentKind, key: string): Record<string, unknown> {
  const payload: Record<string, unknown> = {isExample:false};
  for (const field of editorFields[kind]) payload[field.key] = field.type === "lines" ? [] : "";
  if (kind === "home") delete payload.isExample;
  else if (kind === "testimonial") Object.assign(payload,{id:key,photo:null});
  else payload.slug=key;
  if (kind === "wiki") payload.sections=[{title:"",paragraphs:[]}];
  if (kind === "member") Object.assign(payload,{website:null,photoUrl:null});
  if (kind === "story") Object.assign(payload,{cover:null,blocks:[{id:"paragraph-1",type:"paragraph",text:""}]});
  return payload;
}
