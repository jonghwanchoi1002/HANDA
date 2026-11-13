import ContentTags from "./content-tags";
import RichText from "./rich-text";
import { testimonialSectionTags, type TestimonialSection } from "@/lib/content/testimonial-sections";

export default function TestimonialSectionContent({ section }: { section: TestimonialSection }) {
  return section.highlight ? <ContentTags items={testimonialSectionTags(section)}/> : <RichText text={section.paragraphs.join("\n")} document={section.bodyRichText}/>;
}
