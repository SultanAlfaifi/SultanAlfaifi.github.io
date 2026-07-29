import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import { identity, seo, socialLinks } from "@/data/portfolio";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
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
    canonical: "/"
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
        alt: "Sultan Alfaifi — Full-Stack Software Engineer specializing in AI Agents"
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
        alt: "Sultan Alfaifi — Full-Stack Software Engineer specializing in AI Agents"
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
  themeColor: "#111816",
  colorScheme: "light dark"
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
    <html lang="en" className={`${manrope.variable} ${plexMono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
