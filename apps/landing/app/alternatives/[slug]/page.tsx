import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComparisonSection, FinalCta } from "../../components/marketing-sections";
import { alternatives } from "../../lib/content";
import { site } from "../../lib/site";

interface AlternativePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return alternatives.map((alternative) => ({ slug: alternative.slug }));
}

export async function generateMetadata({ params }: AlternativePageProps): Promise<Metadata> {
  const { slug } = await params;
  const alternative = alternatives.find((item) => item.slug === slug);

  if (!alternative) {
    return {};
  }

  return {
    title: alternative.title,
    description: `${alternative.title}. Compare InvoMir with ${alternative.name} for simple invoicing, payment links, and automatic reminders.`,
    keywords: [alternative.keyword],
    alternates: {
      canonical: `${site.marketingUrl}/alternatives/${alternative.slug}`,
    },
  };
}

export default async function AlternativePage({ params }: AlternativePageProps) {
  const { slug } = await params;
  const alternative = alternatives.find((item) => item.slug === slug);

  if (!alternative) {
    notFound();
  }

  return (
    <main id="main-content">
      <section className="page-hero">
        <div className="section-inner page-hero-inner">
          <span className="section-label">Alternative</span>
          <h1>{alternative.title}</h1>
          <p>{alternative.intro}</p>
          <a href={site.registerUrl} className="btn btn-primary btn-xl">
            Start free trial
          </a>
        </div>
      </section>
      <section className="section">
        <div className="section-inner two-column">
          <div>
            <span className="section-label">Why InvoMir</span>
            <h2>Focused on invoices, payments, and reminders.</h2>
          </div>
          <div className="prose-card">
            <p>
              {alternative.name} can be useful for broader accounting workflows. InvoMir is
              intentionally narrower: create an invoice quickly, send a payment link, track whether
              it was viewed, and let automatic reminders follow up.
            </p>
            <p>
              If you want a clean invoicing workflow without accounting complexity, InvoMir is built
              for that job.
            </p>
          </div>
        </div>
      </section>
      <ComparisonSection />
      <FinalCta />
    </main>
  );
}

