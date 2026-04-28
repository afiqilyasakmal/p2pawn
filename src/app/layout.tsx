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
  title: "P2Pawn",
  description:
    "A serverless, peer-to-peer chess game. Create a game, share the ID, and play directly in your browser.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "P2Pawn",
    description:
      "Play directly with a friend. No sign-up, no server — just share a Game ID and play.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "P2Pawn",
    description:
      "Play directly with a friend. No sign-up, no server — just share a Game ID and play.",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

