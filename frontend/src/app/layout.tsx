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
  title: "Write Duo — Cùng Cố Gắng Học Tiếng Anh Mỗi Ngày",
  description: "Cùng nỗ lực giỏi tiếng Anh mỗi ngày! Luyện dịch & viết câu phản xạ cùng chú cún chăm chỉ và gia sư AI chấm điểm thông minh.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/dog.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Write Duo — Cùng Cố Gắng Học Tiếng Anh Mỗi Ngày",
    description: "Cùng nỗ lực giỏi tiếng Anh mỗi ngày! Luyện dịch & viết câu phản xạ cùng chú cún chăm chỉ và gia sư AI chấm điểm thông minh.",
    url: "https://learnen-five.vercel.app",
    siteName: "Write Duo",
    images: [
      {
        url: "/dog.png",
        width: 640,
        height: 640,
        alt: "Write Duo - Chú cún chăm chỉ nỗ lực học tiếng Anh mỗi ngày",
        type: "image/png",
      },
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Write Duo - Chú cún chăm chỉ nỗ lực học tiếng Anh mỗi ngày",
        type: "image/jpeg",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Write Duo — Cùng Cố Gắng Học Tiếng Anh Mỗi Ngày",
    description: "Cùng nỗ lực giỏi tiếng Anh mỗi ngày! Luyện dịch & viết câu phản xạ cùng chú cún chăm chỉ và gia sư AI chấm điểm thông minh.",
    images: ["/dog.png"],
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
