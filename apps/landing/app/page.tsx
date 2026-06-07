import type { Metadata } from "next";
import { Hero } from "./components/hero";
import {
  ComparisonSection,
  FeaturesSection,
  FinalCta,
  HowItWorksSection,
  LogoBar,
  ProblemSection,
  TestimonialsSection,
} from "./components/marketing-sections";
import { PricingSection } from "./components/pricing-section";
import { site } from "./lib/site";

export const metadata: Metadata = {
  title: "InvoMir - Get paid. Automatically.",
  description:
    "Create professional invoices in 2 minutes, accept online payments, and let InvoMir send automatic payment reminders. Free forever plan available.",
  alternates: {
    canonical: site.marketingUrl,
  },
};

export default function HomePage() {
  return (
    <main id="main-content">
      <Hero />
      <LogoBar />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <ComparisonSection />
      <FinalCta />
    </main>
  );
}

