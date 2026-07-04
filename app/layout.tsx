import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Mayur Masala Center",
  description: "Sales, purchase & expense tracker",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "MM Center" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#B4182A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MM Center" />
      </head>
      <body className="bg-masala-cream text-masala-brown min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}