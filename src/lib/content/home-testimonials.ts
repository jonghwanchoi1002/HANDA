import type { Testimonial } from "@/types/testimonial";

export function selectHomeTestimonials(testimonials: Testimonial[], random = Math.random): Testimonial[] {
  const pool = testimonials.filter(item => !item.isExample);
  for (let index = pool.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [pool[index], pool[other]] = [pool[other], pool[index]];
  }
  return pool.slice(0, 3);
}
