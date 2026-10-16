import Image from "next/image";
import type { StoryImage } from "@/types/story";
import styles from "@/app/stories/stories.module.css";

export default function StoryPhoto({ image }: { image: StoryImage }) {
  return <figure className={styles.photo}><Image src={image.url} alt={image.alt} width={image.width} height={image.height} unoptimized />{image.caption && <figcaption>{image.caption}</figcaption>}</figure>;
}
