import { connection } from "next/server";
import type { Testimonial } from "@/types/testimonial";
import { selectHomeTestimonials } from "@/lib/content/home-testimonials";
import HomeTestimonialCarousel from "./home-testimonial-carousel";

export default async function HomeTestimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.some(item => !item.isExample)) await connection();
  return <HomeTestimonialCarousel testimonials={selectHomeTestimonials(testimonials).map(({ id, quote, name, introduction }) => ({ id, quote, name, introduction }))}/>;
}
