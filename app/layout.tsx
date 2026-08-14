import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.elmacaadventure.co.ke"),

  title: {
    default: "Elmaca Adventure | Explore Kenya & The World Differently",
    template: "%s | Elmaca Adventure",
  },

  description:
    "Elmaca Adventure brings people together through road trips, outdoor experiences, and meaningful connections across Kenya. Book your next adventure today.",

  keywords: [
    "Elmaca Adventure",
    "Kenya adventures",
    "Adventure trips Kenya",
    "Road trips Kenya",
    "Outdoor experiences",
    "Team building Kenya",
    "Group travel Kenya",
    "Travel Kenya",
    "Kisumu adventures",
    "Nature adventures",
  ],

  authors: [
    {
      name: "Elmaca Adventure",
    },
  ],

  creator: "Elmaca Adventure",
  publisher: "Elmaca Adventure",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Elmaca Adventure | Explore Kenya & The World Differently",

    description:
      "Road trips, adventures, hiking, team building, and unforgettable outdoor experiences across Kenya.",

    url: "/",

    siteName: "Elmaca Adventure",

    locale: "en_KE",

    type: "website",

    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Elmaca Adventure",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "Elmaca Adventure | Explore Kenya & The World Differently",

    description:
      "Explore Kenya through road trips, hiking adventures, outdoor experiences, and meaningful connections.",

    images: ["/images/og-image.jpg"],
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },

  category: "Travel",
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