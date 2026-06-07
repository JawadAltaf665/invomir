import type { Metadata } from "next";
import { PageHero } from "../components/page-hero";
import { site } from "../lib/site";

export const metadata: Metadata = {
  title: "System Status",
  description: "Current public status information for the InvoMir marketing website and app links.",
  alternates: {
    canonical: `${site.marketingUrl}/status`,
  },
};

export default function StatusPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="Status"
        title="System status"
        description="A lightweight public status page for InvoMir marketing and app access."
      />
      <section className="section">
        <div className="section-inner status-list">
          {["Marketing website", "Application links", "Help center", "Public pages"].map((item) => (
            <article className="card status-card" key={item}>
              <span className="status-dot" />
              <div>
                <h2>{item}</h2>
                <p>Operational</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

