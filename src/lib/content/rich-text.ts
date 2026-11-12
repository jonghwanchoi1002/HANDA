import { z } from "zod";

export const fontSizes = ["12px","14px","16px","18px","20px","24px","28px","32px","40px","48px"] as const;
const mark = z.discriminatedUnion("type",[
  z.object({type:z.literal("bold")}).strict(),
  z.object({type:z.literal("italic")}).strict(),
  z.object({type:z.literal("underline")}).strict(),
  z.object({type:z.literal("textStyle"),attrs:z.object({fontSize:z.enum(fontSizes)}).strict()}).strict(),
]);
const inlineNode=z.discriminatedUnion("type",[
  z.object({type:z.literal("text"),text:z.string().min(1).max(30000),marks:z.array(mark).max(4).optional()}).strict(),
  z.object({type:z.literal("hardBreak")}).strict(),
]);
export const richTextDocumentSchema=z.object({
  type:z.literal("doc"),
  content:z.array(z.object({type:z.literal("paragraph"),content:z.array(inlineNode).max(3000).optional()}).strict()).max(500),
}).strict().superRefine((doc,ctx)=>{
  let characters=0,nodes=0;
  for(const p of doc.content)for(const n of p.content??[]){nodes++;characters+=n.type==="text"?n.text.length:1;}
  if(characters>30000||nodes>3000)ctx.addIssue({code:"custom",message:"서식 내용이 너무 깁니다."});
});
export type RichTextMark=z.infer<typeof mark>;
export type RichTextInline=z.infer<typeof inlineNode>;
export type RichTextDocument=z.infer<typeof richTextDocumentSchema>;
export const richTextMapSchema=z.record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/),richTextDocumentSchema).refine(map=>Object.keys(map).length<=40,"Too many formatted fields");
export type RichTextMap=z.infer<typeof richTextMapSchema>;
export function richTextPlain(doc:RichTextDocument):string{
  return doc.content.map(p=>(p.content??[]).map(n=>n.type==="text"?n.text:"\n").join("")).join("\n");
}
export function documentFromText(value:string):RichTextDocument{
  return {type:"doc",content:value.split(/\r?\n/).map(line=>({type:"paragraph",...(line?{content:[{type:"text",text:line} as const]}:{})}))};
}
export function assertRichTextMatches(doc:RichTextDocument|undefined,value:string|string[],path:(string|number)[]){
  if(!doc)return;
  const actual=richTextPlain(doc);
  const normalized=Array.isArray(value)?actual.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).join("\n"):actual.trim();
  const expected=Array.isArray(value)?value.join("\n"):value.trim();
  if(normalized!==expected)throw new z.ZodError([{code:"custom",path,message:"서식과 본문 내용이 일치하지 않습니다."}]);
}
