import type { Metadata } from "next";
import { PageHero } from "../components/page-hero";
import { site } from "../lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "InvoMir privacy policy covering collected data, usage, GDPR rights, cookies, and privacy contact details.",
  alternates: {
    canonical: `${site.marketingUrl}/privacy`,
  },
};

const sections = [
  {
    title: "Data collected",
    body: "InvoMir collects account information, workspace details, invoice records, client records, payment metadata, support messages, and technical logs needed to operate the service.",
  },
  {
    title: "How data is used",
    body: "Data is used to authenticate users, run workspaces, generate invoices, send reminders, process subscription billing, improve reliability, and provide customer support.",
  },
  {
    title: "GDPR rights",
    body: "Eligible users can request access, correction, erasure, restriction, portability, and objection. Contact privacy@invomir.com for privacy requests.",
  },
  {
    title: "Cookie policy",
    body: "The marketing site is designed without advertising cookies. The app uses essential cookies for secure authentication and session handling.",
  },
  {
    title: "Contact",
    body: `Privacy questions can be sent to ${site.privacyEmail}.`,
  },
];

export default function PrivacyPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="How InvoMir collects, uses, and protects data."
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

