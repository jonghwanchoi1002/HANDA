"use client";

export default function ContentError({ reset }: { reset: () => void }) {
  return <main style={{ padding: "64px 24px", maxWidth: 800, margin: "auto" }}><h1>콘텐츠를 불러오지 못했습니다.</h1><p>잠시 후 다시 시도해 주세요.</p><button type="button" onClick={reset} style={{ padding: "12px 20px", cursor: "pointer" }}>다시 시도</button></main>;
}
