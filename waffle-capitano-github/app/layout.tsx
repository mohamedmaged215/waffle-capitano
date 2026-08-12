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
  icons: { icon: "/waffle-capitano-logo.jpeg", shortcut: "/waffle-capitano-logo.jpeg" },
  openGraph: {
    title: "وافل كابيتانو — الحلو × مكانه",
    description: "شوف المنيو والأسعار واطلب على واتساب.",
    locale: "ar_EG",
    type: "website",
    images: [{ url: "/waffle-capitano-logo.jpeg", width: 1576, height: 1576, alt: "وافل كابيتانو" }],
  },
  twitter: { card: "summary_large_image", title: "وافل كابيتانو", description: "الحلو × مكانه", images: ["/waffle-capitano-logo.jpeg"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
