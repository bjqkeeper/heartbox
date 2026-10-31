import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "心事信箱 · 把难说的话，温柔地寄出",
  description: "给朋友和恋人的定时信封与温和反馈空间。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
