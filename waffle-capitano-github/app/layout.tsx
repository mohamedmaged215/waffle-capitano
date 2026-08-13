import type { Metadata } from "next";
import "./globals.css";

const deploymentUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(deploymentUrl),
  title: "وافل كابيتانو | وافل وديزرت في برنشت",
  description: "منيو وافل كابيتانو في برنشت: وافل، فريسكا، كيك وديزرت. شوف الأسعار واطلب بسهولة على واتساب.",
  applicationName: "وافل كابيتانو",
  keywords: ["وافل كابيتانو", "وافل برنشت", "حلويات برنشت", "ديزرت", "فريسكا"],
  icons: { icon: "/waffle-capitano-logo.png", shortcut: "/waffle-capitano-logo.png" },
  openGraph: {
    title: "وافل كابيتانو — الحلو × مكانه",
    description: "شوف المنيو والأسعار واطلب على واتساب.",
    locale: "ar_EG",
    type: "website",
    images: [{ url: "/waffle-capitano-logo.png", width: 1254, height: 1254, alt: "وافل كابيتانو" }],
  },
  twitter: { card: "summary_large_image", title: "وافل كابيتانو", description: "الحلو × مكانه", images: ["/waffle-capitano-logo.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
