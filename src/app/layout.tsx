import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HANDA | 시작하고, 함께 성장합니다.",
  description: "창업의 고민과 경험을 나누는 베를린 창업자 커뮤니티, HANDA.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
