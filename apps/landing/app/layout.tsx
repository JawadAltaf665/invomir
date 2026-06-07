import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono, Syne } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import { Footer } from "./components/footer";
import { Nav } from "./components/nav";
import { site } from "./lib/site";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const description =
  "InvoMir - Create invoices in 2 minutes, get paid online, and let automated reminders chase clients for you. Free forever plan available.";

export const metadata: Metadata = {
  metadataBase: new URL(site.marketingUrl),
  title: {
    default: "InvoMir - Get paid. Automatically.",
    template: "%s | InvoMir",
  },
  description,
  applicationName: "InvoMir",
  authors: [{ name: "Jawad Altaf" }],
  creator: "Jawad Altaf",
  publisher: "InvoMir",
  alternates: {
    canonical: site.marketingUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: site.marketingUrl,
    siteName: "InvoMir",
    title: "InvoMir - Get paid. Automatically.",
    description:
      "Create professional invoices in 2 minutes. Accept online payments. Let InvoMir send payment reminders automatically.",
    images: [
      {
        url: "/assets/og/invomir-og-image.svg",
        width: 1200,
        height: 630,
        alt: "InvoMir marketing website preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@invomir",
    title: "InvoMir - Get paid. Automatically.",
    description: "Invoicing SaaS for freelancers. Send invoices, get paid online, auto-reminders.",
    images: ["/assets/og/invomir-og-image.svg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.svg" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1A56DB",
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "InvoMir",
  url: site.marketingUrl,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free plan available. Paid plans from $9/month.",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "200",
  },
  description:
    "InvoMir helps freelancers and small businesses create invoices, accept online payments, and collect automatically via smart reminders.",
  founder: {
    "@type": "Person",
    name: "Jawad Altaf",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${syne.variable} ${dmSans.variable} ${jetBrainsMono.variable}`}
    >
      <body suppressHydrationWarning>
        <Script
          id="strip-extension-hydration-attrs"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(() => {
  const shouldRemove = (name) => name === "bis_skin_checked" || name === "bis_register" || name.startsWith("__processed_");
  const strip = () => {
    document.querySelectorAll("*").forEach((element) => {
      Array.from(element.attributes).forEach((attribute) => {
        if (shouldRemove(attribute.name)) {
          element.removeAttribute(attribute.name);
        }
      });
    });
  };
  strip();
  const observer = new MutationObserver(strip);
  observer.observe(document.documentElement, { attributes: true, subtree: true });
  window.addEventListener("load", () => window.setTimeout(() => observer.disconnect(), 2000), { once: true });
})();
            `,
          }}
        />
        <a className="skip-nav" href="#main-content">
          Skip to content
        </a>
        <Nav />
        {children}
        <Footer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
      </body>
    </html>
  );
}
