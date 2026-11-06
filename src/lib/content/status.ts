export type ContentStatus = "draft" | "pending" | "published";
export const statusLabels:Record<ContentStatus,string>={draft:"임시 저장",pending:"작성 완료 · 공개 대기 중",published:"공개"};
