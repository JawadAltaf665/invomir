import Link from "next/link";
import { comparisonRows, homepageFeatures, howItWorksSteps, testimonials } from "../lib/content";
import { site } from "../lib/site";
import { Icon, IconName } from "./icons";

const trustLabels = [
  "Pakistan",
  "UAE",
  "Saudi Arabia",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Netherlands",
  "Spain",
  "India",
];

type FeatureStatusCard = {
  icon: IconName;
  title: string;
  body: string;
};

const featureStatusCards: readonly (readonly FeatureStatusCard[])[] = [
  [
    { icon: "check", title: "Ready in 2 minutes", body: "Clean workflow, no spreadsheet." },
    { icon: "fileText", title: "Draft saved", body: "Invoice number assigned on save." },
    { icon: "send", title: "Ready to send", body: "Client details and totals are set." },
  ],
  [
    { icon: "creditCard", title: "Payment link ready", body: "Client can pay by card." },
    { icon: "lock", title: "Secure checkout", body: "Stripe handles the payment flow." },
    { icon: "dollarSign", title: "Paid online", body: "Money routes to your Stripe account." },
  ],
  [
    { icon: "bell", title: "Next reminder scheduled", body: "Follow-up is ready automatically." },
    { icon: "send", title: "Reminder sent", body: "Client gets a polite payment nudge." },
    { icon: "check", title: "Reminder enabled", body: "No manual chasing needed." },
  ],
  [
    { icon: "eye", title: "Invoice viewed", body: "Open tracking updated the timeline." },
    { icon: "bell", title: "Follow-up insight", body: "Know when to wait or remind." },
    { icon: "check", title: "Status updated", body: "Sent moved to viewed automatically." },
  ],
  [
    { icon: "barChart", title: "Revenue updated", body: "Dashboard totals stay current." },
    { icon: "dollarSign", title: "Outstanding tracked", body: "See who still owes you." },
    { icon: "globe", title: "Currency converted", body: "Reports use your workspace currency." },
  ],
  [
    { icon: "smartphone", title: "Sent from mobile", body: "Create invoices from any browser." },
    { icon: "check", title: "Ready on site", body: "Finish the job and send the invoice." },
    { icon: "creditCard", title: "Client can pay", body: "Payment link works on every device." },
  ],
] as const;

export function LogoBar() {
  return (
    <section className="logo-bar" aria-label="Social proof">
      <p className="logo-bar-label">Freelancers and agencies in 20+ countries trust InvoMir</p>
      <div className="logo-track" aria-hidden="true">
        {[...trustLabels, ...trustLabels].map((label, index) => (
          <span className="logo-pill" key={`${label}-${index}`}>
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}

export function ProblemSection() {
  const beforeItems = [
    "Invoice sent through a chat PDF with bank details at the bottom",
    "Waited 3 weeks. Client says they forgot.",
    "Awkward follow-up message at 11pm",
    "Spreadsheet to track 20 unpaid invoices",
    "20 percent of revenue lost to late or forgotten payments",
  ];

  const afterItems = [
    "Professional PDF sent in 2 minutes from your phone",
    "Client pays online instantly. No bank details needed.",
    "InvoMir sends reminders automatically. You never ask.",
    "Dashboard shows exactly who owes what",
    "Average payment time cut from 28 days to 6 days",
  ];

  return (
    <section className="section problem-section" aria-labelledby="problem-title">
      <div className="section-inner">
        <div className="section-header reveal">
          <span className="section-label">The problem</span>
          <h2 id="problem-title" className="section-title">
            Getting paid should not feel like begging.
          </h2>
        </div>
        <div className="problem-grid">
          <article className="problem-card problem-card-before reveal">
            <span className="problem-kicker">The old way</span>
            <ul>
              {beforeItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="problem-card problem-card-after reveal">
            <span className="problem-kicker">The InvoMir way</span>
            <ul>
              {afterItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  return (
    <section className="section features-section" id="features" aria-labelledby="features-title">
      <div className="section-inner">
        <div className="section-header reveal">
          <span className="section-label">Features</span>
          <h2 id="features-title" className="section-title">
            Everything you need to send, track, and collect invoices.
          </h2>
        </div>
        <div className="feature-stack">
          {homepageFeatures.map((feature, index) => (
            <article className="feature-block reveal" key={feature.title}>
              <div className="feature-copy">
                <span className="feature-icon">
                  <Icon name={feature.icon as IconName} className="icon-sm" />
                </span>
                <span className="section-label">{feature.eyebrow}</span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
                <div className="chip-row">
                  {feature.chips.map((chip) => (
                    <span className="chip" key={chip}>
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
              <FeatureMockup variant={feature.mockup} index={index} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureMockup({ variant, index }: { variant: string; index: number }) {
  const statusCards = featureStatusCards[index] ?? featureStatusCards[0];

  return (
    <div className={`feature-mockup mockup-${variant}`} aria-label={`${variant} feature preview`}>
      <div className="mock-window-bar">
        <span />
        <span />
        <span />
      </div>
      <div className="mock-window-content">
        <div className="mock-window-header">
          <strong>{["Invoice draft", "Pay now", "Reminder timeline", "Invoice viewed", "Revenue", "Mobile invoice"][index]}</strong>
          <small>InvoMir</small>
        </div>
        <div className="mock-lines">
          <span />
          <span />
          <span />
        </div>
        <div className="mock-highlight-stack">
          {statusCards.map((card) => (
            <div className="mock-highlight mock-highlight-animated" key={card.title}>
              <Icon name={card.icon} className="icon-sm" />
              <div>
                <strong>{card.title}</strong>
                <p>{card.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section className="section how-section" aria-labelledby="how-title">
      <div className="section-inner">
        <div className="section-header reveal">
          <span className="section-label">How it works</span>
          <h2 id="how-title" className="section-title">
            Three steps from work done to money collected.
          </h2>
        </div>
        <div className="steps-grid stagger">
          {howItWorksSteps.map((step, index) => (
            <article className="step-card reveal" key={step.title}>
              <span className="step-number">0{index + 1}</span>
              <Icon name={step.icon as IconName} className="icon-lg" />
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  return (
    <section className="section testimonials-section" aria-labelledby="testimonials-title">
      <div className="section-inner">
        <div className="section-header reveal">
          <span className="section-label">Testimonials</span>
          <h2 id="testimonials-title" className="section-title">
            Real people. Faster payments.
          </h2>
        </div>
        <div className="testimonial-grid stagger">
          {testimonials.map((testimonial) => (
            <article className="testimonial-card reveal" key={testimonial.name}>
              <div className="rating" aria-label="5-star rating">
                5/5
              </div>
              <blockquote>{testimonial.quote}</blockquote>
              <div className="testimonial-person">
                <span>{testimonial.initials}</span>
                <div>
                  <strong>{testimonial.name}</strong>
                  <p>
                    {testimonial.role}, {testimonial.location}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ComparisonSection() {
  return (
    <section className="section comparison-section" aria-labelledby="comparison-title">
      <div className="section-inner">
        <div className="section-header reveal">
          <span className="section-label">Comparison</span>
          <h2 id="comparison-title" className="section-title">
            Built for simple invoicing, not accounting overload.
          </h2>
        </div>
        <div className="comparison-table-wrap reveal">
          <table className="comparison-table">
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col">InvoMir</th>
                <th scope="col">FreshBooks</th>
                <th scope="col">QuickBooks</th>
                <th scope="col">Wave</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([feature, invomir, freshbooks, quickbooks, wave]) => (
                <tr key={feature}>
                  <th scope="row">{feature}</th>
                  <td>{invomir}</td>
                  <td>{freshbooks}</td>
                  <td>{quickbooks}</td>
                  <td>{wave}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="comparison-note">We checked these prices in June 2026. They may have changed.</p>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="section final-cta" aria-labelledby="final-cta-title">
      <div className="final-cta-inner">
        <h2 id="final-cta-title">Stop waiting to get paid.</h2>
        <p>Join 500+ freelancers who use InvoMir to get paid faster, automatically.</p>
        <div className="hero-cta">
          <a href={site.registerUrl} className="btn btn-light btn-xl">
            Start free trial - no card needed
          </a>
          <Link href="/pricing" className="btn btn-outline-light btn-xl">
            See pricing <Icon name="arrowRight" className="icon-sm" />
          </Link>
        </div>
      </div>
    </section>
  );
}
