import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Youngeun Office",
  description: "교육관 회의실 예약 프로그램",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
