import type { Metadata } from "next";
import { Nunito, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { IronManCursor } from "../components/IronManCursor";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://learnen-five.vercel.app"),
  title: "Write Duo — Học Tiếng Anh Cố Gắng Mỗi Ngày",
  description: "Cùng nỗ lực giỏi tiếng Anh mỗi ngày! Học tương tác Reading & Writing với AI chấm điểm thông minh.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Write Duo — Học Tiếng Anh Cố Gắng Mỗi Ngày",
    description: "Cùng nỗ lực giỏi tiếng Anh mỗi ngày! Học tương tác qua Reading & Writing với gia sư AI chấm điểm chi tiết.",
    url: "https://learnen-five.vercel.app",
    siteName: "Write Duo",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Write Duo - Chú chó cố gắng học tiếng Anh chăm chỉ",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Write Duo — Học Tiếng Anh Cố Gắng Mỗi Ngày",
    description: "Cùng nỗ lực giỏi tiếng Anh mỗi ngày! Học tương tác qua Reading & Writing với gia sư AI chấm điểm chi tiết.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${nunito.variable} ${jetbrainsMono.variable} font-sans h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var m = localStorage.getItem('vspeak_theme_mode');
                if (m === 'light') {
                  document.documentElement.classList.remove('dark');
                } else if (m === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col transition-colors duration-300">
        <IronManCursor />
        {children}
      </body>
    </html>
  );
}
