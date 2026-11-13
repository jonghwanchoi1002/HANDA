import Image from "next/image";
import { connection } from "next/server";
import type { ContentMap } from "@/lib/content/schema";
import { selectHomePhoto } from "@/lib/content/home-photos";
import styles from "@/app/page.module.css";
export default async function HomeHeroPhoto({ home }: { home: ContentMap["home"] }) {
  if (home.heroPhotoMode === "random" && (home.heroPhotos?.length ?? 0) > 1) await connection();
  const photo = selectHomePhoto(home);
  return <Image className={styles.heroPhoto} src={photo.url} alt={photo.alt} fill sizes="100vw" priority unoptimized/>;
}
