import type { Membership } from "../auth/permissions";
import { canReadWiki, canManageMembers } from "../auth/permissions";

export function imageURLs(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(imageURLs);
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key,item]) => key === "websites" ? [] : key === "url" || key === "photoUrl" ? typeof item === "string" ? [item] : [] : imageURLs(item));
  return [];
}
export type MediaViewer = Membership & {id: string};
export function canReadMedia(viewer: MediaViewer | null, media: {uploader_id:string|null;kind:string;content_key:string}, content?: {author_id:string|null;payload:unknown;status:string;is_example:boolean;publication_consent:boolean}): boolean {
  if (content) {
    if (content.status === "published") {
      if (media.kind === "wiki") return canReadWiki(viewer);
      if (media.kind !== "testimonial" || content.is_example || content.publication_consent) return true;
    }
    if (canManageMembers(viewer)) return true;
    if (media.kind === "wiki" && canReadWiki(viewer) && content.author_id === viewer?.id) return true;
  }
  return canReadWiki(viewer) && (canManageMembers(viewer) || media.uploader_id === viewer?.id);
}
