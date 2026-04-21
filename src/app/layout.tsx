import type { Metadata } from "next";
import "./globals.css";
import { GlobalErrorHandler } from "@/components/GlobalErrorHandler";

export const metadata: Metadata = {
  title: "StockView - 股票交易整合平台",
  description: "整合多券商数据，统一查看盈亏情况",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <GlobalErrorHandler />
        {children}
      </body>
    </html>
  );
}
