import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HANDA | 작은 시작, 새로운 가능성",
  description: "HANDA 홈페이지에 오신 것을 환영합니다.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
