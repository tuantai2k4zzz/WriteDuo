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
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Write Duo - Chú cún chăm chỉ nỗ lực học tiếng Anh mỗi ngày",
        type: "image/jpeg",
      },
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Write Duo - Chú cún chăm chỉ nỗ lực học tiếng Anh mỗi ngày",
        type: "image/png",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Write Duo — Cùng Cố Gắng Học Tiếng Anh Mỗi Ngày",
    description: "Cùng nỗ lực giỏi tiếng Anh mỗi ngày! Luyện dịch & viết câu phản xạ cùng chú cún chăm chỉ và gia sư AI chấm điểm thông minh.",
    images: ["/og-image.jpg"],
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
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://learnen-five.vercel.app" />
        <meta property="og:title" content="Write Duo — Cùng Cố Gắng Học Tiếng Anh Mỗi Ngày" />
        <meta property="og:description" content="Cùng nỗ lực giỏi tiếng Anh mỗi ngày! Luyện dịch & viết câu phản xạ cùng chú cún chăm chỉ và gia sư AI chấm điểm thông minh." />
        <meta property="og:image" content="https://learnen-five.vercel.app/og-image.jpg" />
        <meta property="og:image:secure_url" content="https://learnen-five.vercel.app/og-image.jpg" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Write Duo - Chú cún chăm chỉ nỗ lực học tiếng Anh mỗi ngày" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Write Duo — Cùng Cố Gắng Học Tiếng Anh Mỗi Ngày" />
        <meta name="twitter:description" content="Cùng nỗ lực giỏi tiếng Anh mỗi ngày! Luyện dịch & viết câu phản xạ cùng chú cún chăm chỉ và gia sư AI chấm điểm thông minh." />
        <meta name="twitter:image" content="https://learnen-five.vercel.app/og-image.jpg" />
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
