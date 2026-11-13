import { homeMainPhoto } from "@/data/home-artwork";
import type { ContentMap } from "./schema";
export const defaultHomePhoto = { url: homeMainPhoto, alt: "베를린 카페에서 함께 이야기를 나누는 HANDA 멤버들", width: 1920, height: 1080 };
export function getHomePhotos(home: Pick<ContentMap["home"], "heroPhotos">) {
  return home.heroPhotos?.length ? home.heroPhotos : [defaultHomePhoto];
}
export function selectHomePhoto(home: Pick<ContentMap["home"], "heroPhotos"|"heroPhotoMode"|"heroPhotoUrl">, random = Math.random) {
  const photos = getHomePhotos(home);
  return home.heroPhotoMode === "random" ? photos[Math.min(photos.length - 1, Math.max(0, Math.floor(random() * photos.length)))] : photos.find(photo => photo.url === home.heroPhotoUrl) ?? photos[0];
}
