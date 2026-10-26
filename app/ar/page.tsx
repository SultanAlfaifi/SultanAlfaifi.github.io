import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";
import { getContent } from "@/data/i18n";

const { seo, identity } = getContent("ar");

export const metadata: Metadata = {
  title: seo.title,
  description: seo.description,
  alternates: {
    canonical: "/ar/",
    languages: { en: "/", ar: "/ar/", "x-default": "/" }
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: "/ar/",
    title: seo.title,
    description: seo.description,
    siteName: identity.name,
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: `${identity.name}، ${identity.role}` }]
  },
  twitter: {
    card: "summary_large_image",
    title: seo.title,
    description: seo.description,
    creator: "@SultAlfaifi",
    images: ["/opengraph-image.png"]
  }
};

export default function ArabicHome() {
  return <HomePage locale="ar" />;
}
