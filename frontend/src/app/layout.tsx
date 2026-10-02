import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { IronManCursor } from "../components/IronManCursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Write Duo — Học Tiếng Anh Tương Tác Qua Reading & Writing",
  description: "Giao diện Stark Tech 2026 học tiếng Anh tương tác phong cách Ironman HUD hiện đại.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col transition-colors duration-300">
        <IronManCursor />
        {children}
      </body>
    </html>
  );
}
