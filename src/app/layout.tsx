import ApprovalNotice from "@/components/approval-notice";
import AccountMenu from "@/components/account-menu";
import SiteHeader from "@/components/site-header";
import { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HANDA | 시작하고, 함께 성장합니다.",
  description: "창업의 고민과 경험을 나누는 베를린 창업자 커뮤니티, HANDA.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body><SiteHeader accountMenu={<Suspense fallback={<p role="status">메뉴를 불러오고 있습니다.</p>}><AccountMenu /></Suspense>} /><Suspense fallback={null}><ApprovalNotice /></Suspense><Suspense fallback={<main style={{ padding: "64px 24px" }}><p role="status">HANDA 콘텐츠를 불러오는 중입니다.</p></main>}>{children}</Suspense></body>
    </html>
  );
}
