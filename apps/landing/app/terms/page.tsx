import type { Metadata } from "next";
import { PageHero } from "../components/page-hero";
import { site } from "../lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "InvoMir terms of service covering user responsibilities, payments, intellectual property, liability, and governing law.",
  alternates: {
    canonical: `${site.marketingUrl}/terms`,
  },
};

const sections = [
  {
    title: "User responsibilities",
    body: "You are responsible for the accuracy of invoice content, client details, tax information, account access, and lawful use of InvoMir.",
  },
  {
    title: "Payment terms",
    body: "InvoMir subscription billing is handled through the app. Client invoice payments are processed by connected payment providers where enabled.",
  },
  {
    title: "Intellectual property",
    body: "InvoMir owns the product, website, branding, software, and design. You retain ownership of your business data and invoice content.",
  },
  {
    title: "Limitation of liability",
    body: "InvoMir is provided to help manage invoicing workflows. The service is not accounting, tax, legal, or payroll advice.",
  },
  {
    title: "Governing law",
    body: "These terms are governed by the applicable law for InvoMir's operating entity and service agreements.",
  },
];

export default function TermsPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="Legal"
        title="Terms of Service"
        description="The rules for using InvoMir and the public marketing website."
      />
      <section className="section legal-section">
        <div className="section-inner legal-content">
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

