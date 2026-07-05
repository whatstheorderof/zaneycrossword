import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
  title: {
    default: "Zaney Crossword",
    template: "%s | Zaney Crossword",
  },
  description:
    "Daily mini, medium, and weekend giant crosswords with funny clues. Play, share, and keep your streak alive.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://zaney-crossword.vercel.app",
  ),
  openGraph: {
    title: "Zaney Crossword",
    description: "Funny clues. Daily puzzles. Share your solve time.",
    siteName: "Zaney Crossword",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zaney Crossword",
    description: "Daily crosswords with unhinged-but-fair clues.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-stone-950 text-stone-100">
        {children}
        <Toaster theme="dark" position="bottom-center" />
      </body>
    </html>
  );
}
