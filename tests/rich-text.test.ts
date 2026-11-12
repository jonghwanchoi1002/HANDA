import assert from "node:assert/strict";
import {test} from "node:test";
import {documentFromText,richTextDocumentSchema,richTextPlain,normalizeTextColor,type RichTextDocument} from "../src/lib/content/rich-text";
import {parseContent} from "../src/lib/content/schema";
import {getInitialContent} from "../src/lib/content/initial";

const formatted:RichTextDocument={type:"doc",content:[{type:"paragraph",content:[{type:"text",text:"서식 테스트",marks:[{type:"bold"},{type:"italic"},{type:"underline"},{type:"textStyle",attrs:{fontSize:"24px"}}]}]}]};
test("structured formatting preserves allowed sizes and marks without changing plain search text",()=>{
  assert.deepEqual(richTextDocumentSchema.parse(formatted),formatted);
  assert.equal(richTextPlain(formatted),"서식 테스트");
  assert.equal(richTextPlain(documentFromText("첫 줄\n둘째 줄")),"첫 줄\n둘째 줄");
  for(const kind of ["wiki","story","member","testimonial","home","page"] as const){
    const initial=getInitialContent().find(entry=>entry.kind===kind)!;
    const payload=structuredClone(initial.payload) as Record<string,unknown>;
    const key=kind==="member"?"introduction":kind==="testimonial"?"quote":kind==="home"?"heroTitle":kind==="page"?"body":"title";
    payload[key]=kind==="member"?["서식 테스트"]:"서식 테스트";
    payload.richText={...(payload.richText as object),[key]:formatted};
    assert.deepEqual(parseContent(kind,payload).richText?.[key],formatted);
  }
});
test("arbitrary HTML nodes, unsafe attributes, unknown styles and excessive data are rejected",()=>{
  for(const node of [{type:"image",attrs:{src:"javascript:alert(1)"}},{type:"text",text:"x",attrs:{onclick:"alert(1)"}},{type:"text",text:"x",marks:[{type:"link",attrs:{href:"javascript:alert(1)"}}]},{type:"text",text:"x",marks:[{type:"textStyle",attrs:{fontSize:"9999px"}}]},{type:"text",text:"x",marks:[{type:"textStyle",attrs:{fontSize:"24px",color:"url(javascript:alert(1))"}}]}]){
    assert.equal(richTextDocumentSchema.safeParse({type:"doc",content:[{type:"paragraph",content:[node]}]}).success,false);
  }
  assert.equal(richTextDocumentSchema.safeParse(documentFromText("x".repeat(30001))).success,false);
  const text='<script>alert("x")</script>';
  assert.equal(richTextPlain(richTextDocumentSchema.parse(documentFromText(text))),text);
});
test("formatting cannot conceal mismatched text in field maps, wiki sections or story blocks",()=>{
  const entries=getInitialContent();
  const wiki=structuredClone(entries.find(e=>e.kind==="wiki")!.payload) as Record<string,unknown>;
  assert.throws(()=>parseContent("wiki",{...wiki,richText:{title:formatted}}),/일치/);
  const section={title:"원래 제목",paragraphs:["원래 본문"],bodyRichText:formatted};
  assert.throws(()=>parseContent("wiki",{...wiki,sections:[section]}),/일치/);
  const story=entries.find(e=>e.kind==="story")!.payload as Record<string,unknown>;
  assert.throws(()=>parseContent("story",{...story,blocks:[{id:"one",type:"paragraph",text:"원래 본문",richText:formatted}]}),/일치/);
  assert.throws(()=>parseContent("wiki",{...wiki,richText:{doesNotExist:formatted}}));
});
test("legacy plain text still validates and local page data stays a short placeholder with a safe form link",()=>{
  const about=parseContent("page",getInitialContent().find(e=>e.kind==="page"&&e.key==="about")!.payload);
  assert.equal(about.body,"커뮤니티 소개 내용을 준비하고 있습니다.");
  assert.equal(about.richText,undefined);
  assert.equal(about.ctaUrl,"https://forms.gle/SXXxb8321efoPFta8");
  const wiki=getInitialContent().find(e=>e.kind==="wiki")!.payload as Record<string,unknown>;
  assert.equal(parseContent("wiki",wiki).richText,undefined);
});

test("text colors support color-only and combined styles while rejecting arbitrary CSS",()=>{
  for(const attrs of [{color:"#A94A27"},{fontSize:"24px",color:"#123abc"},{fontSize:"24px"}]){
    const doc={type:"doc",content:[{type:"paragraph",content:[{type:"text",text:"색상",marks:[{type:"textStyle",attrs}]}]}]};
    assert.equal(richTextDocumentSchema.safeParse(doc).success,true);
  }
  for(const color of ["red","transparent","#123","#11223344","#000000;display:none","var(--ink)","url(https://example.test/x)"]){
    const doc={type:"doc",content:[{type:"paragraph",content:[{type:"text",text:"색상",marks:[{type:"textStyle",attrs:{color}}]}]}]};
    assert.equal(richTextDocumentSchema.safeParse(doc).success,false);
  }
  assert.equal(normalizeTextColor("#A94A27"),"#a94a27");
  assert.equal(normalizeTextColor("rgb(169, 74, 39)"),"#a94a27");
  assert.equal(normalizeTextColor("rgb(256, 0, 0)"),undefined);
  assert.equal(normalizeTextColor("rgba(1, 2, 3, 0)"),undefined);
});

test("legacy testimonial single bodies remain readable without affecting the summary",()=>{
  const legacy=parseContent("testimonial",getInitialContent().find(entry=>entry.kind==="testimonial")!.payload);
  assert.equal(legacy.body,undefined);
  const detailed=parseContent("testimonial",{...legacy,body:"서식 테스트",richText:{body:formatted}});
  assert.equal(detailed.quote,legacy.quote);
  assert.deepEqual(detailed.richText?.body,formatted);
  assert.equal(parseContent("testimonial",{...legacy,body:""}).body,"");
  assert.throws(()=>parseContent("testimonial",{...legacy,body:"다른 본문",richText:{body:formatted}}),/일치/);
});
