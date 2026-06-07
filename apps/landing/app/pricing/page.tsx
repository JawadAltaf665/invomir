import type { Metadata } from "next";
import { FinalCta, TestimonialsSection } from "../components/marketing-sections";
import { PageHero } from "../components/page-hero";
import { PricingSection } from "../components/pricing-section";
import { pricingPlans } from "../lib/content";
import { site } from "../lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple InvoMir pricing with a free plan, online payments, automatic reminders, report exports, and team seats.",
  alternates: {
    canonical: `${site.marketingUrl}/pricing`,
  },
};

const comparisonFeatures = [
  "Clients",
  "Invoices",
  "Seats",
  "Auto reminders",
  "Online payments",
  "Report exports",
  "Team seats",
];

export default function PricingPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="Pricing"
        title="Simple pricing. No surprises."
        description="Start free. Upgrade only when you need more clients, more invoices, payments, exports, or team seats."
      />
      <PricingSection expanded />
      <section className="section" aria-labelledby="feature-comparison-title">
        <div className="section-inner">
          <div className="section-header reveal">
            <span className="section-label">Full comparison</span>
            <h2 id="feature-comparison-title" className="section-title">
              Compare every plan.
            </h2>
          </div>
          <div className="comparison-table-wrap reveal">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  {pricingPlans.map((plan) => (
                    <th scope="col" key={plan.id}>
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={feature}>
                    <th scope="row">{feature}</th>
                    {pricingPlans.map((plan) => (
                      <td key={`${plan.id}-${feature}`}>{plan.features[index]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <TestimonialsSection />
      <FinalCta />
    </main>
  );
}

