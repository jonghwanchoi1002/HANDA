import assert from "node:assert/strict";
import { test } from "node:test";
import { testimonialRecords } from "../src/data/testimonials";
import { parseContent } from "../src/lib/content/schema";
import { selectHomeTestimonials } from "../src/lib/content/home-testimonials";

test("home carousel samples up to three distinct real reviews without mutating public content",()=>{
 const entries=Array.from({length:5},(_,i)=>parseContent("testimonial",{...testimonialRecords[0],id:`review-${i}`,isExample:false}));
 const before=entries.map(item=>item.id);
 const sample=selectHomeTestimonials([...entries,parseContent("testimonial",testimonialRecords[0])],()=>0);
 assert.equal(sample.length,3);assert.equal(new Set(sample.map(item=>item.id)).size,3);
 assert.ok(sample.every(item=>!item.isExample));assert.deepEqual(entries.map(item=>item.id),before);
 assert.notDeepEqual(selectHomeTestimonials(entries,()=>0).map(item=>item.id),selectHomeTestimonials(entries,()=>0.999).map(item=>item.id));
 for(const count of [0,1,2])assert.equal(selectHomeTestimonials(entries.slice(0,count)).length,count);
 assert.deepEqual(selectHomeTestimonials([parseContent("testimonial",testimonialRecords[0])]),[]);
});
