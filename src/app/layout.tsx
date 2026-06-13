import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notion OS Generator",
  description: "Generate and install Notion operating systems from validated AI blueprints.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
