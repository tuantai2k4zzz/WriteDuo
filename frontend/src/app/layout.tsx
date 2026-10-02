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
