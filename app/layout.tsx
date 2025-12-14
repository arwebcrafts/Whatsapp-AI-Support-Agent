import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Automate WhatsApp Chats & Boost Sales | WhaSales AI",
  description: "Boost your business with WhaSales AI to automate WhatsApp chats and close more sales effortlessly. Our powerful AI WhatsApp automation tool replies instantly, works 24/7, and handles customer conversations just like a human. Whether you run an e-commerce store, service company, or local business, WhaSales AI helps you respond faster, qualify leads, and turn conversations into sales—without code or WhatsApp Business API. Save time, increase engagement, and grow your revenue while our intelligent chatbot manages chats automatically.",
  keywords: ["WhatsApp automation", "AI chatbot", "WhatsApp Business", "sales automation", "lead generation", "customer support automation"],
  authors: [{ name: "WhaSales AI" }],
  creator: "WhaSales AI",
  publisher: "WhaSales AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/favicon.svg" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://whasales.ai",
    title: "WhaSales AI - Turn WhatsApp Chats Into Sales with AI",
    description: "AI-powered WhatsApp automation. Reply instantly 24/7, convert 3x more leads. No API needed. Start free!",
    siteName: "WhaSales AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "WhaSales AI - WhatsApp Sales Automation",
    description: "AI replies to WhatsApp chats 24/7. Convert 3x more leads. Start free trial!",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
