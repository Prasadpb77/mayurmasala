import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mayur Masala Center",
  description: "Sales, purchase & expense tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-masala-cream text-masala-brown min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
