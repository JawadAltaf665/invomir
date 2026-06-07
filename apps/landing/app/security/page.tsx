import type { Metadata } from "next";
import { PageHero } from "../components/page-hero";
import { Icon } from "../components/icons";
import { site } from "../lib/site";

export const metadata: Metadata = {
  title: "Security",
  description:
    "InvoMir security overview for authentication, workspace isolation, payment routing, and HTTPS access.",
  alternates: {
    canonical: `${site.marketingUrl}/security`,
  },
};

const items = [
  "Secure authentication and session handling",
  "Workspace data isolation",
  "HTTPS-only production access",
  "Stripe-powered subscription and payment flows",
  "Privacy-first marketing site with no advertising cookies",
];

export default function SecurityPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="Security"
        title="Built for trusted invoice operations."
        description="InvoMir protects workspace data, authentication, and payment workflows with practical SaaS security patterns."
      />
      <section className="section">
        <div className="section-inner value-grid">
          {items.map((item) => (
            <article className="card value-card" key={item}>
              <Icon name="shield" className="icon-sm" />
              <h2>{item}</h2>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

