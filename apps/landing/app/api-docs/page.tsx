import type { Metadata } from "next";
import { PageHero } from "../components/page-hero";
import { site } from "../lib/site";

export const metadata: Metadata = {
  title: "API Docs",
  description: "Public API documentation landing page for InvoMir.",
  alternates: {
    canonical: `${site.marketingUrl}/api-docs`,
  },
};

export default function ApiDocsPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="Developers"
        title="API docs"
        description="Public API documentation will live here as InvoMir opens developer integrations."
      />
      <section className="section">
        <div className="section-inner two-column">
          <div>
            <span className="section-label">Current scope</span>
            <h2>App APIs are private during this launch phase.</h2>
          </div>
          <div className="prose-card">
            <p>
              The marketing site includes this page because the documented footer references API
              docs. Public integration docs can be added here when external access is available.
            </p>
            <a href={`mailto:${site.supportEmail}`} className="btn btn-secondary">
              Contact InvoMir
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

