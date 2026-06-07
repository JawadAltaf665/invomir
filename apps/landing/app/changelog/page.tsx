import type { Metadata } from "next";
import { PageHero } from "../components/page-hero";
import { site } from "../lib/site";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Product updates and release notes for InvoMir.",
  alternates: {
    canonical: `${site.marketingUrl}/changelog`,
  },
};

const updates = [
  {
    title: "Marketing website launch",
    date: "June 2026",
    body: "Public pages for product positioning, pricing, blog, help, legal, and app conversion links.",
  },
  {
    title: "InvoMir app foundation",
    date: "June 2026",
    body: "Dashboard, invoices, clients, payments, reports, settings, subscriptions, team, notifications, and language support.",
  },
];

export default function ChangelogPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="Product"
        title="Changelog"
        description="Follow public InvoMir product and marketing updates."
      />
      <section className="section">
        <div className="section-inner timeline">
          {updates.map((update) => (
            <article className="card timeline-item" key={update.title}>
              <span>{update.date}</span>
              <h2>{update.title}</h2>
              <p>{update.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

