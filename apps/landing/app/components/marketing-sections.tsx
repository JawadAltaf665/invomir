"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "./icons";
import {
  homepageFeatures,
  howItWorksSteps,
  testimonials,
  extendedPricingFaqs
} from "../lib/content";
import { site } from "../lib/site";

export function ProblemSection() { return null; }
export function ComparisonSection() { return null; }
export function LogoBar() { return null; }

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

export function StatsBand() {
  const sectionRef = useRef<HTMLElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!sectionRef.current || hasAnimated) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setHasAnimated(true);
        const elements = sectionRef.current?.querySelectorAll('.stat-number');
        elements?.forEach(el => {
          const targetStr = el.getAttribute('data-target') || '0';
          const target = parseInt(targetStr, 10);
          const suffix = el.getAttribute('data-suffix') || '';
          const prefix = el.getAttribute('data-prefix') || '';
          
          let start: number | null = null;
          const duration = 1800;
          function step(timestamp: number) {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const value = Math.floor(easeOutCubic(progress) * target);
            if (target >= 1000000) {
              el.textContent = prefix + (value / 1000000).toFixed(1) + 'M' + suffix;
            } else {
              el.textContent = prefix + value.toLocaleString() + suffix;
            }
            if (progress < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section ref={sectionRef} className="stats-band" aria-label="Statistics">
      <style dangerouslySetInnerHTML={{__html: `
        .stats-band {
          background: var(--color-surface);
          border-top: 1px solid var(--color-border);
          border-bottom: 1px solid var(--color-border);
          padding: 48px 20px; display: flex; flex-direction: column; gap: 32px;
        }
        @media (min-width: 768px) {
          .stats-band { flex-direction: row; justify-content: space-evenly; padding: 64px 80px; }
        }
        .stat-item { text-align: center; position: relative; flex: 1; }
        .stat-number {
          font-family: var(--font-display); font-weight: 800; font-size: 52px;
          background: var(--gradient-brand); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        @media (min-width: 768px) {
          .stat-number { font-size: 64px; }
        }
        .stat-label { font-size: 14px; color: var(--color-muted); margin-top: 8px; }
        @media (min-width: 768px) {
          .stat-label { font-size: 16px; }
        }
        .stat-divider {
          width: 100%; height: 1px; background: var(--color-border);
        }
        @media (min-width: 768px) {
          .stat-divider { width: 1px; height: 60px; align-self: center; }
        }
      `}} />
      <div className="stat-item">
        <div className="stat-number" data-prefix="$" data-target="4200000" data-suffix="+">$0M+</div>
        <div className="stat-label">Paid out to freelancers</div>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <div className="stat-number" data-target="12000" data-suffix="+">0+</div>
        <div className="stat-label">Invoices sent monthly</div>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <div className="stat-number" data-target="98" data-suffix="%">0%</div>
        <div className="stat-label">On-time payment rate</div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section className="section" style={{ background: 'var(--color-bg)' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .eyebrow { font-family: var(--font-mono); font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 16px; display: block; }
        .hiw-grid { display: flex; flex-direction: column; gap: 24px; position: relative; margin-top: 48px; }
        @media (min-width: 1024px) {
          .hiw-grid { flex-direction: row; gap: 32px; }
          .hiw-connector {
            position: absolute; top: 56px; left: 16%; right: 16%;
            border-top: 2px dashed var(--color-border); z-index: 0;
          }
        }
        .hiw-card { position: relative; z-index: 1; flex: 1; text-align: left; }
        .hiw-num { font-family: var(--font-mono); font-size: 13px; color: var(--color-muted); display: block; margin-bottom: 16px; }
        .hiw-icon-wrap { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .hiw-card h3 { font-size: 18px; margin-bottom: 8px; }
        .hiw-card p { font-size: 15px; }
      `}} />
      <div className="section-inner" style={{ textAlign: 'center' }}>
        <span className="eyebrow" style={{ color: 'var(--color-brand)' }} data-reveal="fade-up" data-delay="0">The Process</span>
        <h2 data-reveal="fade-up" data-delay="100">Three steps. Zero chasing.</h2>
        
        <div className="hiw-grid" data-reveal-stagger>
          <div className="hiw-connector" />
          
          <div className="card hiw-card" data-reveal="scale-up">
            <span className="hiw-num">01</span>
            <div className="hiw-icon-wrap" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1' }}>
              <Icon name="fileText" className="icon-sm" />
            </div>
            <h3>Create your invoice</h3>
            <p>Add your client, line items, and due date. InvoMir auto-numbers everything.</p>
          </div>
          
          <div className="card hiw-card" data-reveal="scale-up">
            <span className="hiw-num">02</span>
            <div className="hiw-icon-wrap" style={{ background: 'rgba(6,182,212,0.1)', color: '#06B6D4' }}>
              <Icon name="send" className="icon-sm" />
            </div>
            <h3>Send in one click</h3>
            <p>Your client gets a branded email with a live payment link. No login required.</p>
          </div>
          
          <div className="card hiw-card" data-reveal="scale-up">
            <span className="hiw-num">03</span>
            <div className="hiw-icon-wrap" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
              <Icon name="shield" className="icon-sm" />
            </div>
            <h3>Get paid automatically</h3>
            <p>InvoMir sends payment reminders on your behalf. Money lands in your account.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="section" style={{ background: 'var(--color-bg)' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .bento-grid {
          display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 48px;
        }
        @media (min-width: 768px) { .bento-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .bento-grid { grid-template-columns: repeat(12, 1fr); } }
        
        .bento-card { display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative; }
        .bento-card h3 { font-size: 20px; margin-bottom: 8px; }
        .bento-card p { font-size: 15px; margin-bottom: 24px; }
        
        @media (min-width: 1024px) {
          .span-8 { grid-column: span 8; }
          .span-6 { grid-column: span 6; }
          .span-4 { grid-column: span 4; }
        }
      `}} />
      <div className="section-inner">
        <div style={{ textAlign: 'center' }}>
          <span className="eyebrow" style={{ color: 'var(--color-teal)' }} data-reveal="fade-up">What you get</span>
          <h2 data-reveal="fade-up" data-delay="100">Everything to run your billing.</h2>
          <p data-reveal="fade-up" data-delay="200" style={{ marginTop: '16px' }}>Built for freelancers, consultants, and growing teams.</p>
        </div>

        <div className="bento-grid" data-reveal-stagger>
          <div className="card bento-card span-8" data-reveal="scale-up" style={{ boxShadow: 'inset 0 0 80px rgba(99,102,241,0.06)' }}>
            <div>
              <h3>Professional Invoices</h3>
              <p>Create beautiful invoices that get paid faster.</p>
            </div>
            <div style={{ background: '#1C2333', padding: '16px', borderRadius: '12px', borderTop: '2px solid var(--color-brand)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '13px', color: 'white' }}>Invoice INV-047</strong>
                <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Client: Raza Khan</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ display: 'block', fontSize: '14px', color: 'white' }}>$850.00</strong>
                <span style={{ fontSize: '10px', background: 'rgba(245,158,11,0.15)', color: '#F59E0B', padding: '2px 8px', borderRadius: '99px' }}>PAID</span>
              </div>
            </div>
          </div>

          <div className="card bento-card span-4" data-reveal="scale-up">
            <div style={{ width: '48px', height: '48px', background: 'rgba(129,140,248,0.1)', color: '#818CF8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Icon name="bell" className="icon-sm" />
            </div>
            <h3>Auto Reminders</h3>
            <p>InvoMir nudges late payers — 3 days before, on due date, 7 days after.</p>
          </div>

          <div className="card bento-card span-4" data-reveal="scale-up">
            <div style={{ width: '48px', height: '48px', background: 'rgba(245,158,11,0.1)', color: '#F59E0B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Icon name="zap" className="icon-sm" />
            </div>
            <h3>One-Click Payments</h3>
            <p>Clients pay from the invoice email. No account needed.</p>
          </div>

          <div className="card bento-card span-8" data-reveal="scale-up" style={{ boxShadow: 'inset 0 0 80px rgba(6,182,212,0.06)' }}>
            <div>
              <h3>Real-Time Dashboard</h3>
              <p>See outstanding, paid, and overdue at a glance.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', padding: '6px 16px', borderRadius: '99px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>💰 $12,400 Paid</span>
              <span style={{ background: 'rgba(99,102,241,0.1)', color: '#818CF8', padding: '6px 16px', borderRadius: '99px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>📤 $3,200 Sent</span>
              <span style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '6px 16px', borderRadius: '99px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>⚠ $800 Overdue</span>
            </div>
          </div>

          <div className="card bento-card span-6" data-reveal="scale-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(6,182,212,0.1)', color: '#06B6D4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="globe" className="icon-sm" /></div>
              <h3>Multi-Currency</h3>
            </div>
            <p>Invoice in USD, PKR, GBP, EUR. Auto-format for every locale.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['USD', 'PKR', 'EUR', 'GBP'].map(c => <span key={c} style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>{c}</span>)}
            </div>
          </div>

          <div className="card bento-card span-6" data-reveal="scale-up">
            <span style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(245,158,11,0.15)', color: '#F59E0B', padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Business Plan</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(129,140,248,0.1)', color: '#818CF8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="users" className="icon-sm" /></div>
              <h3>Team Seats</h3>
            </div>
            <p>Add up to 3 team members. Shared clients and invoices.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  return (
    <section className="section" style={{ background: '#0A0B0F', borderTop: '1px solid var(--color-border)' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .testi-scroll {
          display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory;
          padding-bottom: 24px; margin-top: 48px; scrollbar-width: none; -webkit-overflow-scrolling: touch;
        }
        .testi-scroll::-webkit-scrollbar { display: none; }
        .testi-card { min-width: 85vw; scroll-snap-align: start; }
        @media (min-width: 768px) {
          .testi-scroll { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; overflow-x: visible; }
          .testi-card { min-width: 0; }
        }
      `}} />
      <div className="section-inner">
        <span className="eyebrow" style={{ color: '#818CF8' }} data-reveal="fade-up">Loved by freelancers</span>
        <h2 data-reveal="fade-up" data-delay="100">People actually get paid now.</h2>
        
        <div className="testi-scroll" data-reveal-stagger>
          <div className="card testi-card" data-reveal="fade-up">
            <div style={{ color: '#F59E0B', fontSize: '14px', letterSpacing: '2px', marginBottom: '16px' }}>★★★★★</div>
            <p style={{ fontSize: '15px', fontStyle: 'italic', marginBottom: '24px' }}>&quot;I used to spend hours chasing payments. InvoMir sends reminders automatically — my clients actually pay on time now.&quot;</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', color: '#818CF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold' }}>SA</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>Sara A.</div>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>UI/UX Freelancer</div>
              </div>
            </div>
          </div>
          
          <div className="card testi-card" data-reveal="fade-up">
            <div style={{ color: '#F59E0B', fontSize: '14px', letterSpacing: '2px', marginBottom: '16px' }}>★★★★★</div>
            <p style={{ fontSize: '15px', fontStyle: 'italic', marginBottom: '24px' }}>&quot;The invoices look incredible. My clients ask if I hired a designer. It&apos;s just InvoMir.&quot;</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(6,182,212,0.2)', color: '#06B6D4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold' }}>RK</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>Raza K.</div>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Dev Agency Owner</div>
              </div>
            </div>
          </div>
          
          <div className="card testi-card" data-reveal="fade-up">
            <div style={{ color: '#F59E0B', fontSize: '14px', letterSpacing: '2px', marginBottom: '16px' }}>★★★★★</div>
            <p style={{ fontSize: '15px', fontStyle: 'italic', marginBottom: '24px' }}>&quot;Switched from spreadsheets. Setup took 10 minutes. My first invoice was paid the same day.&quot;</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(245,158,11,0.2)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold' }}>MF</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>Maya F.</div>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Content Strategist</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProductTourSection() {
  return (
    <section className="section" style={{ background: 'var(--color-surface)' }}>
      <div className="section-inner" style={{ textAlign: 'center' }}>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes macDotBlink {
            0%, 100% { opacity: 0.4; transform: scale(0.95); }
            50% { opacity: 1; box-shadow: 0 0 8px currentColor; transform: scale(1.05); }
          }
          .mac-dot { width: 12px; height: 12px; border-radius: 50%; animation: macDotBlink 2s infinite; }
          .mac-dot:nth-child(1) { background: #ef4444; color: #ef4444; animation-delay: 0s; }
          .mac-dot:nth-child(2) { background: #f59e0b; color: #f59e0b; animation-delay: 0.2s; }
          .mac-dot:nth-child(3) { background: #22c55e; color: #22c55e; animation-delay: 0.4s; }
        `}} />
        <span className="eyebrow" style={{ color: 'var(--color-teal)' }} data-reveal="fade-up">Product Tour</span>
        <h2 data-reveal="fade-up" data-delay="100">A dashboard built for clarity.</h2>
        
        <div style={{ maxWidth: '960px', margin: '48px auto 32px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 60px 120px rgba(0,0,0,0.7), 0 0 0 1px var(--color-border)' }} data-reveal="scale-up">
          <div style={{ height: '40px', background: 'var(--color-elevated)', display: 'flex', alignItems: 'center', padding: '0 16px', position: 'relative' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="mac-dot"></div>
              <div className="mac-dot"></div>
              <div className="mac-dot"></div>
            </div>
            <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-bg)', padding: '4px 16px', borderRadius: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>app.invomir.com/dashboard</div>
          </div>
          <div style={{ display: 'flex', background: 'var(--color-bg)', textAlign: 'left' }}>
            <div style={{ width: '200px', background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', padding: '20px 0', display: 'none' }} className="tour-sidebar">
              <div style={{ padding: '0 20px', fontWeight: 600, fontSize: '14px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '6px', height: '6px', background: 'var(--color-brand)', borderRadius: '50%' }}></div>InvoMir</div>
              <div style={{ padding: '10px 20px', fontSize: '13px', color: 'var(--color-muted)' }}>Dashboard</div>
              <div style={{ padding: '10px 20px', fontSize: '13px', color: 'white', background: 'rgba(99,102,241,0.1)', borderLeft: '3px solid var(--color-brand)' }}>Invoices</div>
              <div style={{ padding: '10px 20px', fontSize: '13px', color: 'var(--color-muted)' }}>Clients</div>
              <div style={{ padding: '10px 20px', fontSize: '13px', color: 'var(--color-muted)' }}>Payments</div>
            </div>
            <style dangerouslySetInnerHTML={{__html: `@media(min-width: 768px) { .tour-sidebar { display: block !important; } }`}} />
            <div style={{ flex: 1, padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>Invoices</div>
                <button className="btn btn-primary" style={{ minHeight: '36px', fontSize: '13px', padding: '0 16px' }}>New Invoice</button>
              </div>
              <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--color-border)', marginBottom: '16px', fontSize: '13px', color: 'var(--color-muted)' }}>
                <span style={{ paddingBottom: '8px', color: 'white', borderBottom: '2px solid var(--color-brand)' }}>All</span>
                <span style={{ paddingBottom: '8px' }}>Draft</span>
                <span style={{ paddingBottom: '8px' }}>Sent</span>
              </div>
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ color: 'var(--color-muted)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '12px 0' }}>#</th>
                      <th>Client</th>
                      <th>Amount</th>
                      <th className="hide-mobile">Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}><td style={{ padding: '14px 0' }}>INV-047</td><td>Raza Khan</td><td>$850</td><td className="hide-mobile">Jun 25</td><td><span style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>PAID</span></td></tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}><td style={{ padding: '14px 0' }}>INV-046</td><td>Sara Ali</td><td>$1,200</td><td className="hide-mobile">Jun 20</td><td><span style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8', padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>SENT</span></td></tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}><td style={{ padding: '14px 0' }}>INV-045</td><td>Maya Farooq</td><td>$450</td><td className="hide-mobile">Jun 15</td><td><span style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>OVERDUE</span></td></tr>
                  </tbody>
                </table>
              </div>
              <style dangerouslySetInnerHTML={{__html: `@media(max-width: 767px) { .hide-mobile { display: none; } }`}} />
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }} data-reveal-stagger>
          <span style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)', borderRadius: '99px', padding: '8px 16px', fontSize: '13px' }} data-reveal="fade-up">🔒 Bank-level security</span>
          <span style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)', borderRadius: '99px', padding: '8px 16px', fontSize: '13px' }} data-reveal="fade-up">⚡ 60-second invoicing</span>
          <span style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)', borderRadius: '99px', padding: '8px 16px', fontSize: '13px' }} data-reveal="fade-up">📱 iOS & Android</span>
        </div>
      </div>
    </section>
  );
}

export function MobileAppSection() {
  const [time, setTime] = useState("9:41");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      setTime(`${formattedHours}:${formattedMinutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="section" style={{ background: 'linear-gradient(180deg, #0A0B0F 0%, #0d0f1a 100%)' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .mobile-app-grid { display: flex; flex-direction: column; gap: 48px; align-items: center; }
        .mobile-text { text-align: center; z-index: 2; }
        .mobile-phones { position: relative; height: 480px; width: 100%; max-width: 320px; perspective: 1200px; }
        @media (min-width: 768px) {
          .mobile-app-grid { flex-direction: row; align-items: center; justify-content: space-between; }
          .mobile-text { text-align: left; flex: 5; }
          .mobile-phones { flex: 7; height: 560px; max-width: 500px; }
          .phone-front-wrap { animation: floatFront 4s ease-in-out infinite; }
          .phone-back-wrap { animation: floatBack 4s ease-in-out 0.5s infinite; }
        }
        
        @keyframes floatFront {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes floatBack {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }

        .store-btn { display: flex; align-items: center; gap: 10px; background: var(--color-elevated); border: 1px solid var(--color-border); border-radius: 12px; padding: 0 20px; height: 48px; transition: all 0.2s; cursor: pointer; flex: 1; }
        .store-btn:hover { border-color: var(--color-brand); transform: translateY(-2px); }
        
        .phone-mockup { width: 220px; aspect-ratio: 9/19.5; border-radius: 36px; border: 4px solid #1e293b; background: #0f172a; box-shadow: inset 0 0 0 2px #000, 0 40px 80px rgba(0,0,0,0.8); position: relative; }
        .phone-screen { width: 100%; height: 100%; border-radius: 30px; overflow: hidden; position: relative; background: #0a0f1c; }
        
        .phone-back-wrap { position: absolute; left: 0; top: 20px; transform: rotateX(15deg) rotateY(25deg) rotateZ(-10deg); transform-style: preserve-3d; }
        .phone-front-wrap { position: absolute; right: 20px; top: 60px; transform: rotateX(30deg) rotateY(-25deg) rotateZ(15deg) scale(1.1); transform-style: preserve-3d; z-index: 10; }

        .floating-cc {
          position: absolute; top: 40%; left: -20%; width: 140%; height: 140px;
          background: linear-gradient(135deg, rgba(6,182,212,0.8), rgba(99,102,241,0.8));
          border-radius: 12px; backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 20px 40px rgba(6,182,212,0.3), inset 0 0 20px rgba(255,255,255,0.2);
          transform: translateZ(50px) rotateX(-10deg) rotateY(-10deg);
          z-index: 5;
          padding: 16px; display: flex; flex-direction: column; justify-content: space-between;
        }

        .bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 120px; padding: 0 16px; margin-top: auto; margin-bottom: 32px; }
        .bar { flex: 1; background: linear-gradient(to top, #c026d3, #3b82f6); border-radius: 2px 2px 0 0; }
        
        .screen-lines { padding: 12px 16px 24px; display: flex; flex-direction: column; gap: 12px; }
        .s-line, .s-circle {
          background: linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.02) 75%);
          background-size: 400% 100%;
          animation: skeletonShimmerMobile 2.5s infinite linear;
        }
        @keyframes skeletonShimmerMobile {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .s-line { height: 6px; border-radius: 4px; }
        .s-circle { width: 24px; height: 24px; border-radius: 50%; }
      `}} />
      <div className="section-inner mobile-app-grid">
        <div className="mobile-text">
          <span className="eyebrow" style={{ color: '#6366F1' }} data-reveal="fade-up">Invomir Mobile</span>
          <h2 data-reveal="fade-up" data-delay="100">Invoice from anywhere.<br/>Get paid on the go.</h2>
          <p data-reveal="fade-up" data-delay="200" style={{ marginTop: '16px', marginBottom: '32px' }}>The InvoMir mobile app for iOS and Android lets you create and send invoices in under 60 seconds — wherever you are.</p>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }} data-reveal="fade-up" data-delay="300">
            <button className="store-btn">
              <Icon name="apple" className="icon-sm" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-muted)', lineHeight: 1 }}>Download on the</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', lineHeight: 1 }}>App Store</div>
              </div>
            </button>
            <button className="store-btn">
              <Icon name="play" className="icon-sm" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-muted)', lineHeight: 1 }}>GET IT ON</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', lineHeight: 1 }}>Google Play</div>
              </div>
            </button>
          </div>
        </div>

        <div className="mobile-phones" data-reveal="fade-left" data-delay="200">
          <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', filter: 'blur(40px)', zIndex: 0 }}></div>
          
          <div className="phone-back-wrap">
            <div className="phone-mockup">
              <div className="phone-screen">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px 4px', fontSize: '11px', fontWeight: 600, color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  <span>{time}</span>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor"><rect x="0" y="6" width="2.5" height="4" rx="0.5" /><rect x="3.8" y="4" width="2.5" height="6" rx="0.5" /><rect x="7.6" y="2" width="2.5" height="8" rx="0.5" /><rect x="11.4" y="0" width="2.5" height="10" rx="0.5" opacity="0.4" /></svg>
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4.5A7 7 0 0112 4.5" /><path d="M4.5 7A3.5 3.5 0 019.5 7" /><circle cx="7" cy="9.5" r="0.5" fill="currentColor" stroke="none" /></svg>
                    <svg width="20" height="10" viewBox="0 0 20 10" fill="none"><rect x="0.5" y="0.5" width="17" height="9" rx="2.5" stroke="currentColor" /><rect x="2" y="2" width="12" height="6" rx="1" fill="currentColor" /><path d="M19 3.5v3" stroke="currentColor" strokeLinecap="round" /></svg>
                  </div>
                </div>
                <div className="screen-lines">
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '12px' }}>Transactions</div>
                  <div className="s-line" style={{ width: '40%' }}></div>
                  <div className="s-line" style={{ width: '70%' }}></div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <div className="s-circle"></div>
                    <div style={{ flex: 1 }}>
                      <div className="s-line" style={{ width: '100%', marginBottom: '8px' }}></div>
                      <div className="s-line" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <div className="s-circle"></div>
                    <div style={{ flex: 1 }}>
                      <div className="s-line" style={{ width: '100%', marginBottom: '8px' }}></div>
                      <div className="s-line" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="floating-cc">
              <div style={{ width: '30px', height: '20px', background: 'rgba(255,255,255,0.4)', borderRadius: '4px' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="s-line" style={{ width: '80%' }}></div>
                <div className="s-line" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="phone-front-wrap">
            <div className="phone-mockup" style={{ background: '#110c1f', borderColor: '#33294a' }}>
              <div className="phone-screen" style={{ background: '#110c1f', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px 4px', fontSize: '11px', fontWeight: 600, color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  <span>{time}</span>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor"><rect x="0" y="6" width="2.5" height="4" rx="0.5" /><rect x="3.8" y="4" width="2.5" height="6" rx="0.5" /><rect x="7.6" y="2" width="2.5" height="8" rx="0.5" /><rect x="11.4" y="0" width="2.5" height="10" rx="0.5" opacity="0.4" /></svg>
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4.5A7 7 0 0112 4.5" /><path d="M4.5 7A3.5 3.5 0 019.5 7" /><circle cx="7" cy="9.5" r="0.5" fill="currentColor" stroke="none" /></svg>
                    <svg width="20" height="10" viewBox="0 0 20 10" fill="none"><rect x="0.5" y="0.5" width="17" height="9" rx="2.5" stroke="currentColor" /><rect x="2" y="2" width="12" height="6" rx="1" fill="currentColor" /><path d="M19 3.5v3" stroke="currentColor" strokeLinecap="round" /></svg>
                  </div>
                </div>
                <div className="screen-lines">
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '12px' }}>Analytics</div>
                  <div className="s-line" style={{ width: '50%' }}></div>
                  <div className="s-line" style={{ width: '30%' }}></div>
                </div>
                
                <div className="bar-chart">
                  <div className="bar" style={{ height: '30%' }}></div>
                  <div className="bar" style={{ height: '40%' }}></div>
                  <div className="bar" style={{ height: '25%' }}></div>
                  <div className="bar" style={{ height: '45%' }}></div>
                  <div className="bar" style={{ height: '60%' }}></div>
                  <div className="bar" style={{ height: '35%' }}></div>
                  <div className="bar" style={{ height: '55%' }}></div>
                  <div className="bar" style={{ height: '70%' }}></div>
                  <div className="bar" style={{ height: '90%' }}></div>
                  <div className="bar" style={{ height: '100%' }}></div>
                  <div className="bar" style={{ height: '80%' }}></div>
                  <div className="bar" style={{ height: '65%' }}></div>
                </div>
                
                <div className="screen-lines" style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.03)' }}>
                  <div className="s-line" style={{ width: '80%' }}></div>
                  <div className="s-line" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="section" style={{ background: 'var(--color-bg)' }}>
      <div className="section-inner" style={{ maxWidth: '720px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span className="eyebrow" style={{ color: 'var(--color-muted)' }} data-reveal="fade-up">FAQ</span>
          <h2 data-reveal="fade-up" data-delay="100">Answers to your questions.</h2>
        </div>
        
        <div data-reveal="fade-up" data-delay="200">
          {extendedPricingFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} style={{ borderBottom: '1px solid var(--color-border)', padding: '20px 0' }}>
                <button 
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: isOpen ? 'var(--color-brand-glow)' : 'white', transition: 'color 0.2s', textAlign: 'left' }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 600 }}>{faq.question}</span>
                  <Icon name="chevronDown" className="icon-sm" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)', color: 'var(--color-muted)' }} />
                </button>
                <div style={{ maxHeight: isOpen ? '200px' : '0', overflow: 'hidden', opacity: isOpen ? 1 : 0, transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease' }}>
                  <p style={{ marginTop: '16px', paddingBottom: '16px' }}>{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function CommandCenterSection() {
  return (
    <section className="section" style={{ background: '#0F111A' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .skeleton-shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 75%);
          background-size: 400% 100%;
          animation: skeletonShimmer 2.5s infinite linear;
          border-radius: 8px;
        }
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .cc-wrapper {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 64px 20px;
          background: rgba(255,255,255,0.01);
          max-width: 1000px;
          margin: 0 auto;
          text-align: center;
        }
        .cc-window {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          background: #0f1219;
          overflow: hidden;
          max-width: 800px;
          margin: 48px auto 0;
          box-shadow: 0 40px 80px rgba(0,0,0,0.5);
          text-align: left;
        }
        .cc-topbar {
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 12px 16px;
          display: flex; align-items: center; position: relative;
        }
        .cc-dots { display: flex; gap: 8px; }
        .cc-url {
          position: absolute; left: 50%; transform: translateX(-50%);
          background: rgba(0,0,0,0.4); padding: 6px 24px; border-radius: 6px;
          font-size: 11px; color: rgba(255,255,255,0.3); font-family: var(--font-mono);
        }
        .cc-body { display: flex; height: 360px; }
        .cc-sidebar {
          width: 200px; border-right: 1px solid rgba(255,255,255,0.05);
          padding: 24px 16px; display: none;
        }
        @media (min-width: 640px) { .cc-sidebar { display: block; } }
        .cc-main { flex: 1; padding: 24px; display: flex; flex-direction: column; gap: 24px; }
        .cc-cards { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 768px) { .cc-cards { grid-template-columns: 1fr 1fr; } }
        .cc-list-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px; background: rgba(255,255,255,0.01);
        }
      `}} />
      <div className="section-inner">
        <div className="cc-wrapper">
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 data-reveal="fade-up" style={{ fontSize: '28px', marginBottom: '16px' }}>Command center for your cash</h2>
            <p data-reveal="fade-up" data-delay="100" style={{ color: 'var(--color-muted)' }}>
              Get a bird&apos;s-eye view of your financial health with our intuitive dark-mode interface.
            </p>
          </div>
          
          <div className="cc-window" data-reveal="scale-up" data-delay="200">
            <div className="cc-topbar">
              <div className="cc-dots">
                <div className="mac-dot"></div><div className="mac-dot"></div><div className="mac-dot"></div>
              </div>
              <div className="cc-url">app.invomir.com/dashboard</div>
            </div>
            <div className="cc-body">
              <div className="cc-sidebar">
                <div className="skeleton-shimmer" style={{ height: '12px', width: '80%', marginBottom: '16px' }}></div>
                <div className="skeleton-shimmer" style={{ height: '12px', width: '60%', marginBottom: '16px' }}></div>
                <div className="skeleton-shimmer" style={{ height: '12px', width: '70%' }}></div>
              </div>
              <div className="cc-main">
                <div className="cc-cards">
                  <div className="skeleton-shimmer" style={{ height: '100px' }}></div>
                  <div className="skeleton-shimmer" style={{ height: '100px' }}></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="cc-list-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className="skeleton-shimmer" style={{ width: '24px', height: '24px', borderRadius: '4px' }}></div>
                      <div className="skeleton-shimmer" style={{ width: '120px', height: '10px' }}></div>
                    </div>
                    <div className="skeleton-shimmer" style={{ width: '40px', height: '10px' }}></div>
                  </div>
                  <div className="cc-list-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className="skeleton-shimmer" style={{ width: '24px', height: '24px', borderRadius: '4px' }}></div>
                      <div className="skeleton-shimmer" style={{ width: '160px', height: '10px' }}></div>
                    </div>
                    <div className="skeleton-shimmer" style={{ width: '40px', height: '10px' }}></div>
                  </div>
                  <div className="cc-list-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className="skeleton-shimmer" style={{ width: '24px', height: '24px', borderRadius: '4px' }}></div>
                      <div className="skeleton-shimmer" style={{ width: '100px', height: '10px' }}></div>
                    </div>
                    <div className="skeleton-shimmer" style={{ width: '40px', height: '10px' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="section" style={{ background: '#0F111A', paddingBottom: '120px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .cta-card {
          background-color: #2563eb;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 32px 32px;
          border-radius: 32px;
          padding: 80px 20px;
          text-align: center;
          position: relative;
          box-shadow: 0 20px 60px rgba(37, 99, 235, 0.25);
        }
        @media (min-width: 768px) {
          .cta-card { padding: 100px 40px; }
        }
        .cta-btn-white {
          background: white; color: #2563eb; border: none;
        }
        .cta-btn-white:hover {
          background: #f8fafc; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .cta-btn-outline {
          background: transparent; color: white; border: 1px solid rgba(255,255,255,0.4);
        }
        .cta-btn-outline:hover {
          background: rgba(255,255,255,0.1); border-color: white; transform: translateY(-2px);
        }
      `}} />
      <div className="section-inner">
        <div className="cta-card" data-reveal="scale-up">
          <h2 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 24px', color: 'white' }} data-reveal="fade-up" data-delay="100">
            Stop waiting to get paid.
          </h2>
          <p style={{ maxWidth: '600px', margin: '0 auto 48px', color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(16px, 2vw, 20px)' }} data-reveal="fade-up" data-delay="200">
            Join 500+ freelancers who use InvoMir to get paid faster, automatically.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexDirection: 'column', width: '100%', maxWidth: '320px', margin: '0 auto' }} data-reveal="fade-up" data-delay="300">
            <a href={site.registerUrl} className="btn cta-btn-white" style={{ width: '100%' }}>
              Start free trial - no card needed
            </a>
            <a href="#pricing" className="btn cta-btn-outline" style={{ width: '100%' }}>
              See pricing <Icon name="arrowRight" className="icon-xs" />
            </a>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @media (min-width: 640px) {
              .cta-card > div[data-reveal="fade-up"] { flex-direction: row !important; max-width: none !important; justify-content: center; }
              .cta-card > div[data-reveal="fade-up"] > a { width: auto !important; }
            }
          `}} />
        </div>
      </div>
    </section>
  );
}

export function TeamSection() {
  return (
    <section id="team" className="section" style={{ background: 'var(--color-bg)' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .team-grid {
          display: grid; grid-template-columns: 1fr; gap: 24px; margin-top: 48px;
        }
        @media (min-width: 768px) {
          .team-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .team-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 32px 24px;
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .team-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.2);
        }
        .team-avatar {
          width: 96px; height: 96px; border-radius: 50%;
          margin: 0 auto 20px;
          background: var(--color-elevated);
          border: 2px solid var(--color-border);
          display: flex; align-items: center; justify-content: center;
          font-size: 32px; font-weight: 700; color: var(--color-brand);
          font-family: var(--font-display);
        }
        .team-name { font-size: 20px; font-weight: 600; color: white; margin-bottom: 4px; }
        .team-role { font-size: 14px; color: var(--color-brand-glow); margin-bottom: 16px; font-weight: 500; }
        .team-bio { font-size: 14px; color: var(--color-muted); line-height: 1.6; }
      `}} />
      <div className="section-inner">
        <div style={{ textAlign: 'center' }}>
          <span className="eyebrow" style={{ color: 'var(--color-teal)' }} data-reveal="fade-up">The Minds Behind InvoMir</span>
          <h2 data-reveal="fade-up" data-delay="100">Meet our team</h2>
          <p data-reveal="fade-up" data-delay="200" style={{ marginTop: '16px', maxWidth: '600px', margin: '16px auto 0', color: 'var(--color-muted)' }}>
            We are a group of designers, engineers, and financial experts dedicated to making billing effortless for freelancers worldwide.
          </p>
        </div>
        
        <div className="team-grid" data-reveal-stagger>
          <div className="team-card" data-reveal="scale-up">
            <div className="team-avatar" style={{ boxShadow: 'inset 0 0 20px rgba(99,102,241,0.2)' }}>JA</div>
            <div className="team-name">Jawad Altaf</div>
            <div className="team-role">Founder & CEO</div>
            <div className="team-bio">
              Former agency owner who got tired of chasing clients for payments. Built InvoMir to solve his own problem.
            </div>
          </div>
          
          <div className="team-card" data-reveal="scale-up" data-delay="100">
            <div className="team-avatar" style={{ boxShadow: 'inset 0 0 20px rgba(6,182,212,0.2)' }}>SM</div>
            <div className="team-name">Sarah Mitchell</div>
            <div className="team-role">Head of Product</div>
            <div className="team-bio">
              Obsessed with simple, intuitive interfaces. Sarah ensures every pixel in InvoMir serves a clear purpose.
            </div>
          </div>
          
          <div className="team-card" data-reveal="scale-up" data-delay="200">
            <div className="team-avatar" style={{ boxShadow: 'inset 0 0 20px rgba(245,158,11,0.2)' }}>DK</div>
            <div className="team-name">David Kim</div>
            <div className="team-role">Lead Engineer</div>
            <div className="team-bio">
              Security and performance fanatic. David built the rock-solid infrastructure that processes millions safely.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
