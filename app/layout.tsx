import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Tools — Free tools for everyday use",
  description:
    "A collection of free, fast tools. Compress images and PDFs without uploading to a server — everything runs locally on our cloud.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <Link href="/" className="header-title">
            Daily Tools
          </Link>
          <Link href="/" className="header-link">
            Home
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
