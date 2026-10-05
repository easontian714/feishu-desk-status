import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eason 的工位状态",
  description: "根据飞书日历实时更新的工位状态牌",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
