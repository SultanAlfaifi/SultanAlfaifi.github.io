import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { motionBootScript } from "@/components/motion-preference";
import { identity, seo, socialLinks } from "@/data/portfolio";
import "./globals.css";
import "./portfolio.css";
import "./signature.css";
import "./experience.css";
import "./agent.css";
import "./cv.css";
import "./welcome.css";
import "./rtl.css";
import "./living.css";
import "./ai.css";

// One family for the whole site, in both languages: IBM Plex Sans Arabic carries Arabic and Latin glyphs.
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(seo.siteUrl),
  title: seo.title,
  description: seo.description,
  applicationName: "Sultan Alfaifi Portfolio",
  authors: [{ name: identity.name }],
  creator: identity.name,
  alternates: {
    canonical: "/",
    languages: { en: "/", ar: "/ar/", "x-default": "/" }
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: seo.title,
    description: seo.description,
    siteName: "Sultan Alfaifi",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Sultan Alfaifi, Full-Stack Software Engineer specializing in AI Agents"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: seo.title,
    description: seo.description,
    creator: "@SultAlfaifi",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Sultan Alfaifi, Full-Stack Software Engineer specializing in AI Agents"
      }
    ]
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#030304",
  colorScheme: "dark"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: identity.name,
    jobTitle: identity.role,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Makkah",
      addressCountry: "SA"
    },
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "Umm Al-Qura University"
    },
    sameAs: socialLinks
      .filter((link) => link.platform !== "Email")
      .map((link) => link.href)
  };

  return (
    <html lang="en" className={plexArabic.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionBootScript }} />
      </head>
      <body className="portfolio-v3">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
