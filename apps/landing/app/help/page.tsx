import type { Metadata } from "next";
import { PageHero } from "../components/page-hero";
import { Icon } from "../components/icons";
import { site } from "../lib/site";

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Find help for getting started, invoices, payments, subscriptions, team access, and account settings in InvoMir.",
  alternates: {
    canonical: `${site.marketingUrl}/help`,
  },
};

const categories = ["Getting Started", "Invoices", "Payments", "Subscriptions", "Team", "Account"];
const popularArticles = [
  "Create your first client",
  "Send an invoice with online payment",
  "Connect your Stripe account",
  "Understand automatic reminders",
  "Invite a team member",
];

export default function HelpPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="Help Center"
        title="How can we help?"
        description="Search guides for invoices, payments, subscriptions, team access, and account settings."
      >
        <form className="help-search" action="/help" role="search">
          <label htmlFor="help-search">Search help articles</label>
          <div>
            <Icon name="search" className="icon-sm" />
            <input id="help-search" name="q" type="search" placeholder="Search help articles" />
          </div>
        </form>
      </PageHero>
      <section className="section">
        <div className="section-inner">
          <div className="category-grid">
            {categories.map((category) => (
              <article className="card help-category" key={category}>
                <Icon name={category === "Payments" ? "creditCard" : "fileText"} className="icon-sm" />
                <h2>{category}</h2>
                <p>Browse common questions about {category.toLowerCase()}.</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section surface-section">
        <div className="section-inner two-column">
          <div>
            <span className="section-label">Popular articles</span>
            <h2>Start with these guides.</h2>
          </div>
          <ul className="popular-list">
            {popularArticles.map((article) => (
              <li key={article}>
                <a href={`mailto:${site.supportEmail}?subject=${encodeURIComponent(article)}`}>
                  {article}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section">
        <div className="section-inner contact-panel">
          <h2>Can&apos;t find what you need?</h2>
          <p>Send a message and the InvoMir team will help you find the right answer.</p>
          <a className="btn btn-primary" href={`mailto:${site.supportEmail}`}>
            Contact support
          </a>
        </div>
      </section>
    </main>
  );
}

