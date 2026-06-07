"use client";

import { useState } from "react";
import { Icon, type IconName } from "./icons";
import {
  type BillingInterval,
  extendedPricingFaqs,
  pricingFaqs,
  pricingPlans,
  type PlanId,
} from "../lib/content";

interface PricingSectionProps {
  expanded?: boolean;
}

const planVisuals: Record<PlanId, { description: string; icon: IconName }> = {
  free: {
    description: "A simple start for testing your invoicing workflow.",
    icon: "fileText",
  },
  starter: {
    description: "For freelancers ready to send unlimited invoices.",
    icon: "send",
  },
  professional: {
    description: "Reports, reminders, and exports for growing teams.",
    icon: "sparkles",
  },
  business: {
    description: "Team access and controls for established workspaces.",
    icon: "shield",
  },
};

export function PricingSection({ expanded = false }: PricingSectionProps) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const faqs = expanded ? extendedPricingFaqs : pricingFaqs;

  return (
    <section className="section pricing-section" id="pricing" aria-labelledby="pricing-title">
      <div className="section-inner">
        <div className="section-header reveal">
          <span className="section-label">Pricing</span>
          <h2 id="pricing-title" className="section-title">
            Simple pricing. No surprises.
          </h2>
          <p className="section-desc">
            Start free. Upgrade when you need unlimited invoices, online payments, report exports,
            or team seats.
          </p>
          <div className="pricing-toggle" aria-label="Billing interval">
            <button
              type="button"
              className={interval === "monthly" ? "active" : ""}
              onClick={() => setInterval("monthly")}
            >
              Monthly
            </button>
            <button
              type="button"
              className={interval === "yearly" ? "active" : ""}
              onClick={() => setInterval("yearly")}
            >
              Yearly <span>save 2 months</span>
            </button>
          </div>
        </div>

        <div className={`pricing-grid pricing-grid-${interval} stagger`}>
          {pricingPlans.map((plan) => {
            const isYearly = interval === "yearly";
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const suffix = plan.monthlyPrice === 0 ? "" : isYearly ? "/year" : "/mo";
            const isFeatured = plan.id === "professional";
            const visual = planVisuals[plan.id];

            return (
              <article
                className={`card card-pricing pricing-plan-${plan.id} reveal ${
                  isFeatured ? "featured" : ""
                }`}
                key={plan.id}
              >
                <div className="pricing-badge-row">
                  {plan.badge ? <span className="pricing-badge">{plan.badge}</span> : null}
                </div>
                <div className="pricing-card-head">
                  <span className="pricing-plan-icon">
                    <Icon name={visual.icon} className="icon-sm" />
                  </span>
                  <div>
                    <h3>{plan.name}</h3>
                    <p>{visual.description}</p>
                  </div>
                </div>
                <div className="price">
                  <small>$</small>
                  <span>{price}</span>
                  {suffix ? <small>{suffix}</small> : null}
                </div>
                <p className="pricing-save">
                  {isYearly && plan.monthlyPrice > 0 ? "Two months included free." : ""}
                </p>
                <ul className="pricing-features">
                  {plan.features.map((feature) => {
                    const unavailable = feature.startsWith("No ");

                    return (
                      <li className={unavailable ? "muted" : ""} key={feature}>
                        <Icon name={unavailable ? "x" : "check"} className="icon-xs" />
                        {feature}
                      </li>
                    );
                  })}
                </ul>
                {plan.disabled ? (
                  <span className="btn btn-secondary btn-disabled" aria-disabled="true">
                    {plan.ctaLabel}
                  </span>
                ) : (
                  <a href={plan.ctaHref} className={`btn ${isFeatured ? "btn-light" : "btn-primary"}`}>
                    {plan.ctaLabel} <Icon name="arrowRight" className="icon-xs" />
                  </a>
                )}
              </article>
            );
          })}
        </div>

        <p className="pricing-note">
          All plans include: 14-day full-feature trial. No credit card required. Cancel anytime.
        </p>

        <div className="faq-grid">
          {faqs.map((item) => (
            <details className="faq-item" key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
