import type { Metadata } from "next";
import { FinalCta } from "../components/marketing-sections";
import { PageHero } from "../components/page-hero";
import { site } from "../lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn why InvoMir exists: helping every freelancer get paid on time with simple invoices, online payments, and automatic reminders.",
  alternates: {
    canonical: `${site.marketingUrl}/about`,
  },
};

const values = [
  {
    title: "Simplicity",
    body: "InvoMir stays focused on invoices, clients, payments, and reminders.",
  },
  {
    title: "Automation",
    body: "The product handles polite follow-ups so you do not have to chase clients manually.",
  },
  {
    title: "Trust",
    body: "Workspace data is isolated, payment routing is clear, and invoices stay professional.",
  },
  {
    title: "Transparency",
    body: "Pricing is simple, the free plan is real, and InvoMir does not take a payment percentage.",
  },
];

export default function AboutPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="About InvoMir"
        title="Every freelancer on earth gets paid on time."
        description="That is the mission. InvoMir exists for people who do good work and should not have to become debt collectors to get paid."
      />
      <section className="section about-story">
        <div className="section-inner two-column">
          <div>
            <span className="section-label">Founder story</span>
            <h2>Built by Jawad Altaf for the payment follow-up problem.</h2>
          </div>
          <div className="prose-card">
            <p>
              I built InvoMir because invoicing should feel calm. Freelancers and small businesses
              need a fast way to send a professional invoice, accept online payment, and follow up
              without sending uncomfortable messages.
            </p>
            <p>
              The goal is not to replace full accounting software. The goal is to help you send the
              invoice, know what happened, and get paid faster.
            </p>
          </div>
        </div>
      </section>
      <section className="section surface-section" aria-labelledby="values-title">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-label">Product values</span>
            <h2 id="values-title" className="section-title">
              Simple, automated, trusted, transparent.
            </h2>
          </div>
          <div className="value-grid">
            {values.map((value) => (
              <article className="card value-card" key={value.title}>
                <h3>{value.title}</h3>
                <p>{value.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="section-inner stats-row">
          {["500+ users", "20+ countries", "10,000+ invoices sent"].map((stat) => (
            <div className="stat-card" key={stat}>
              <strong>{stat.split(" ")[0]}</strong>
              <span>{stat.replace(stat.split(" ")[0], "").trim()}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="section about-nope">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-label">What InvoMir does not do</span>
            <h2 className="section-title">No accounting. No payroll. No nonsense.</h2>
            <p className="section-desc">
              InvoMir is for invoicing, payment collection, client tracking, and reminders.
            </p>
          </div>
        </div>
      </section>
      <FinalCta />
    </main>
  );
}

