"use client";

import { useState } from "react";
import { Icon, type IconName } from "./icons";
import {
  type BillingInterval,
  pricingPlans,
  type PlanId,
} from "../lib/content";

export function PricingSection() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  return (
    <section className="section" id="pricing" aria-labelledby="pricing-title" style={{ background: 'var(--color-bg)' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .pricing-toggle { display: inline-flex; align-items: center; background: var(--color-elevated); border: 1px solid var(--color-border); border-radius: 9999px; padding: 4px; position: relative; margin-bottom: 48px; }
        .pricing-toggle-btn { position: relative; z-index: 1; padding: 10px 24px; font-size: 14px; font-weight: 500; color: var(--color-muted); border: none; background: transparent; border-radius: 9999px; cursor: pointer; transition: color 0.3s; }
        .pricing-toggle-btn.active { color: white; }
        .pricing-toggle-slider { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc(50% - 4px); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 9999px; transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .pricing-toggle[data-active="yearly"] .pricing-toggle-slider { transform: translateX(100%); }
        .yearly-badge { position: absolute; top: -12px; right: -20px; background: rgba(245,158,11,0.15); color: var(--color-amber); border: 1px solid rgba(245,158,11,0.3); font-size: 10px; font-family: var(--font-mono); padding: 2px 8px; border-radius: 9999px; }
        
        .pricing-grid { display: grid; grid-template-columns: 1fr; gap: 24px; margin-bottom: 48px; }
        @media (min-width: 640px) { .pricing-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .pricing-grid { grid-template-columns: repeat(4, 1fr); align-items: stretch; } }

        .pricing-card { position: relative; display: flex; flex-direction: column; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 20px; padding: 28px; transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s ease; }
        @media (min-width: 768px) { .pricing-card { padding: 32px; } }
        .pricing-card:hover { transform: translateY(-6px); }

        .pricing-tag { font-family: var(--font-mono); font-size: 11px; margin-bottom: 16px; display: block; }
        .pricing-price { font-family: var(--font-display); font-size: 52px; font-weight: 800; line-height: 1; margin-bottom: 24px; display: flex; align-items: baseline; gap: 4px; }
        .pricing-suffix { font-family: var(--font-body); font-size: 16px; font-weight: 400; color: var(--color-muted); }
        .pricing-features { list-style: none; padding: 0; margin: 0 0 32px 0; flex: 1; }
        .pricing-features li { display: flex; align-items: flex-start; gap: 12px; font-size: 14px; margin-bottom: 16px; line-height: 1.4; color: var(--color-text); }
        .pricing-features li.muted { color: #374151; text-decoration: line-through; }

        .plan-starter .pricing-tag { color: #818CF8; }
        .plan-starter .pricing-price { background: var(--gradient-brand); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        .plan-professional { 
          background: linear-gradient(145deg, #13152a, #0f1729); 
          border-color: rgba(99,102,241,0.5); 
          box-shadow: 0 0 40px rgba(99,102,241,0.2), 0 0 80px rgba(99,102,241,0.08);
          z-index: 10;
        }
        @media (min-width: 1024px) { .plan-professional { transform: scale(1.04); } .plan-professional:hover { transform: scale(1.04) translateY(-6px); } }
        .plan-professional .pricing-tag { color: #818CF8; }
        .plan-professional .pricing-price { background: var(--gradient-brand); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .most-popular-badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #6366F1, #818CF8); color: white; padding: 4px 16px; border-radius: 9999px; font-size: 12px; font-weight: 600; font-family: var(--font-display); white-space: nowrap; }
        .recommended-badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #3b82f6, #60a5fa); color: white; padding: 4px 16px; border-radius: 9999px; font-size: 12px; font-weight: 600; font-family: var(--font-display); white-space: nowrap; }

        .plan-business { border-color: rgba(245,158,11,0.4); box-shadow: 0 0 30px rgba(245,158,11,0.1); }
        .plan-business .pricing-tag { color: var(--color-amber); }
        .plan-business .btn-ghost:hover { border-color: var(--color-amber); background: rgba(245,158,11,0.08); }
      `}} />
      <div className="section-inner">
        <div style={{ textAlign: 'center' }}>
          <span className="eyebrow" style={{ color: 'var(--color-amber)' }} data-reveal="fade-up">Pricing</span>
          <h2 data-reveal="fade-up" data-delay="100" style={{ marginBottom: '32px' }}>Simple pricing. No surprises.</h2>

          <div className="pricing-toggle" data-active={interval} data-reveal="fade-up" data-delay="200">
            <div className="pricing-toggle-slider" />
            <button className={`pricing-toggle-btn ${interval === 'monthly' ? 'active' : ''}`} onClick={() => setInterval('monthly')}>Monthly</button>
            <button className={`pricing-toggle-btn ${interval === 'yearly' ? 'active' : ''}`} onClick={() => setInterval('yearly')}>
              Yearly
              {interval === 'yearly' && <span className="yearly-badge" style={{ animation: 'scaleIn 0.3s var(--transition-spring)' }}>Save 20%</span>}
            </button>
          </div>
        </div>

        <div className="pricing-grid" data-reveal-stagger>
          {pricingPlans.map((plan) => {
            const isYearly = interval === "yearly";
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const suffix = plan.monthlyPrice === 0 ? "" : "/month";
            const isFeatured = plan.id === "professional";
            const isRecommended = plan.id === "starter";

            return (
              <div key={plan.id} className={`pricing-card plan-${plan.id}`} data-reveal="scale-up">
                {isFeatured && <div className="most-popular-badge" data-reveal="scale-up" data-delay="600">Most Popular</div>}
                {isRecommended && <div className="recommended-badge" data-reveal="scale-up" data-delay="600">Recommended</div>}
                <span className="pricing-tag">{plan.id.toUpperCase()}</span>
                <div className="pricing-price">
                  ${price}<span className="pricing-suffix">{suffix}</span>
                </div>
                <ul className="pricing-features">
                  {plan.features.map(f => {
                    const unavailable = f.startsWith("No ");
                    return (
                      <li key={f} className={unavailable ? 'muted' : ''}>
                        <Icon name={unavailable ? 'x' : 'check'} className="icon-xs" style={{ color: unavailable ? '#374151' : 'var(--color-brand)' }} />
                        <span>{f}</span>
                      </li>
                    );
                  })}
                </ul>
                <a href={plan.ctaHref} className={isFeatured ? 'btn btn-primary' : 'btn btn-ghost'} style={{ width: '100%' }}>
                  {plan.ctaLabel}
                </a>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginBottom: '24px' }}>All plans include a 14-day free trial. Cancel anytime. No contracts.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', filter: 'grayscale(1)', opacity: 0.5 }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Stripe</span>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Visa</span>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Mastercard</span>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>EasyPaisa</span>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>JazzCash</span>
          </div>
        </div>
      </div>
    </section>
  );
}
