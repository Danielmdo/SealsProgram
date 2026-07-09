import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Seals Program - Admin",
  description: "Panel de administración Seals Program",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Seals",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icon-192.png",
    icon: "/icon.svg",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Seals",
    "mobile-web-app-capable": "yes",
    "theme-color": "#f97316",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(function(err) {
      console.log('SW registration failed:', err)
    })
  })
}
            `,
          }}
        />
      </body>
    </html>
  );
}
