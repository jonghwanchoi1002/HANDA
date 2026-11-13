import RichText from "./rich-text";
import type { RichTextDocument } from "@/lib/content/rich-text";
import styles from "./content-tags.module.css";

export type ContentTag = { text: string; document?: RichTextDocument };
export default function ContentTags({ items }: { items: ContentTag[] }) {
  return <ul className={styles.tags}>{items.map((item, index) => <li key={index}><RichText text={item.text} document={item.document} inline/></li>)}</ul>;
}
