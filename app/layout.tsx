import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Elmaca Adventure | Explore Kenya & The World Differently",
    template: "%s | Elmaca Adventure",
  },
  description:
    "Elmaca Adventure brings people together through road trips, outdoor experiences, and meaningful connections across Kenya. Book your next adventure today.",
  keywords: [
    "Kenya adventures",
    "road trips Kenya",
    "outdoor experiences",
    "Elmaca Adventure",
    "safari Kenya",
    "group travel Kenya",
    "Kisumu adventures",
  ],
  authors: [{ name: "Elmaca Adventure" }],
  openGraph: {
    title: "Elmaca Adventure | Explore Kenya & The World Differently",
    description:
      "Road trips, adventures, and outdoor experiences across Kenya. Join us for professionally organized trips that build friendships and lasting memories.",
    type: "website",
    locale: "en_KE",
    siteName: "Elmaca Adventure",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elmaca Adventure",
    description:
      "Explore Kenya & The World Differently. Road trips, adventures, and outdoor experiences.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body className="min-h-screen bg-white font-sans text-slate antialiased">
        {children}
      </body>
    </html>
  );
}
