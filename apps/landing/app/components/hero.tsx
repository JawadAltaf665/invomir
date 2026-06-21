"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import { site } from "../lib/site";

const notificationTargetCount = 50;
const notificationCountDurationMs = 1800;

function AnimatedCount({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (value === 0) return;
    let startTimestamp: number | null = null;
    const duration = 2500;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));
      if (progress < 1) window.requestAnimationFrame(step);
      else setCount(value);
    };
    window.requestAnimationFrame(step);
  }, [value]);
  return <>{value === 0 ? "$0" : `$${count.toLocaleString()}`}</>;
}

export function Hero() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(57);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const primaryDemoButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setNotifCount(c => c + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isDemoOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDemoOpen(false);
        primaryDemoButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isDemoOpen]);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .hero {
          position: relative;
          min-height: 100svh;
          padding: 120px 20px 60px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center;
        }
        @media (min-width: 768px) {
          .hero { padding: 160px 80px 80px; }
        }
        .orb {
          position: absolute; border-radius: 50%; filter: blur(80px);
          pointer-events: none; z-index: 0;
          animation: orbFloat 10s ease-in-out infinite;
        }
        .orb-1 {
          width: 300px; height: 300px; background: var(--color-brand); opacity: 0.12;
          top: 10%; left: 10%;
        }
        .orb-2 {
          width: 250px; height: 250px; background: var(--color-teal); opacity: 0.08;
          bottom: 20%; right: 10%;
        }
        .hero-inner {
          position: relative; z-index: 1; max-width: 800px; margin: 0 auto;
          display: flex; flex-direction: column; align-items: center;
        }
        .hero-badge {
          display: inline-block; padding: 6px 14px; border-radius: 9999px;
          background: var(--color-elevated); border: 1px solid rgba(99,102,241,0.3);
          color: var(--color-brand-glow); font-family: var(--font-mono); font-size: 11px;
          background-size: 200%; animation: shimmer 3s linear infinite;
          margin-bottom: 24px;
        }
        .hero-headline { margin-bottom: 20px; line-height: 1.05; }
        .accent-word {
          background: linear-gradient(135deg, #6366F1, #06B6D4, #818CF8);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientShift 4s ease infinite;
        }
        .hero-sub {
          font-size: clamp(16px, 4vw, 20px); max-width: 520px; margin: 0 auto 40px;
        }
        .hero-cta-group {
          display: flex; flex-direction: column; gap: 16px; width: 100%; max-width: 320px;
          margin: 0 auto 24px;
        }
        @media (min-width: 768px) {
          .hero-cta-group { flex-direction: row; max-width: none; justify-content: center; }
        }
        .hero-social-proof { font-size: 13px; margin-bottom: 60px; }
        .hero-social-proof a { color: var(--color-brand); text-decoration: underline; }

        .dashboard-mockup {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-top: 2px solid var(--color-brand);
          border-radius: 16px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1);
          width: 100%; max-width: 780px; margin: 0 auto;
          overflow: hidden; text-align: left;
        }
        @media (min-width: 768px) {
          .dashboard-mockup { animation: cardFloat 4s ease-in-out infinite; }
        }
        .mockup-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 20px; border-bottom: 1px solid var(--color-border);
          background: var(--color-elevated);
        }
        .mockup-topbar-left { display: flex; align-items: center; gap: 12px; }
        .mockup-topbar-actions { display: flex; align-items: center; gap: 16px; font-size: 13px; color: var(--color-muted); }
        .mockup-selector { display: flex; align-items: center; gap: 4px; }
        .mockup-profile { display: flex; align-items: center; gap: 8px; }
        .mockup-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--color-brand); color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
        
        .mockup-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; padding: 20px; border-bottom: 1px solid var(--color-border); }
        @media (min-width: 768px) {
          .mockup-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .mockup-card { background: var(--color-bg); padding: 16px; border-radius: 8px; border: 1px solid var(--color-border); }
        .mockup-card small { display: block; color: var(--color-muted); font-size: 12px; margin-bottom: 4px; }
        .mockup-card strong { font-size: 20px; color: white; font-family: var(--font-display); }

        .mockup-body { display: flex; flex-direction: column; gap: 20px; padding: 20px; }
        @media (min-width: 768px) {
          .mockup-body { flex-direction: row; }
        }
        .mockup-chart { flex: 1; height: 120px; display: flex; align-items: flex-end; gap: 8px; padding-top: 20px; border-right: 1px solid var(--color-border); padding-right: 20px; }
        @media (max-width: 767px) {
          .mockup-chart { border-right: none; border-bottom: 1px solid var(--color-border); padding-bottom: 20px; padding-right: 0; }
        }
        @keyframes chartGrow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        .mockup-chart span { 
          flex: 1; background: var(--color-brand); border-radius: 4px 4px 0 0; opacity: 0.5; 
          transform-origin: bottom; 
          animation: chartGrow 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .mockup-chart span:nth-child(1) { animation-delay: 0.8s; }
        .mockup-chart span:nth-child(2) { animation-delay: 1.0s; }
        .mockup-chart span:nth-child(3) { animation-delay: 1.2s; }
        .mockup-chart span:nth-child(4) { animation-delay: 1.4s; }
        .mockup-chart span:last-child { opacity: 1; background: var(--gradient-brand); animation-delay: 1.6s; }
        
        .mockup-list { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .mockup-list div { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--color-bg); border-radius: 8px; border: 1px solid var(--color-border); font-size: 13px; position: relative; overflow: hidden; }
        @keyframes heroShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .mockup-list div::before {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(90deg, rgba(255,255,255,0) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 75%);
          background-size: 400% 100%;
          animation: heroShimmer 2.5s infinite linear;
          pointer-events: none;
        }
        
        .payment-logos { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; margin-top: 32px; font-size: 12px; color: var(--color-muted); }
        .payment-logo-pill { padding: 4px 12px; background: var(--color-elevated); border: 1px solid var(--color-border); border-radius: var(--radius-pill); }

        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .demo-modal { background: var(--color-surface); padding: 32px; border-radius: 24px; border: 1px solid var(--color-border); width: 100%; max-width: 600px; position: relative; }
        .modal-close { position: absolute; top: 20px; right: 20px; background: none; border: none; color: var(--color-muted); cursor: pointer; }
      `}} />

      <section className="hero" aria-labelledby="hero-title" data-reveal="fade">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>

        <div className="hero-inner">
          <span className="hero-badge" data-reveal="fade-up" data-delay="0">
            ✦ Trusted by 500+ freelancers in 20+ countries
          </span>
          <h1 id="hero-title" className="hero-headline">
            <div data-reveal="fade-up" data-delay="100">Get paid.</div>
            <div data-reveal="fade-up" data-delay="200" className="accent-word">Automatically.</div>
          </h1>
          <p className="hero-sub" data-reveal="fade-up" data-delay="300">
            InvoMir turns invoice creation into a 2-minute task, then chases your clients for you.
            Send professional invoices, accept online payments, and let automated reminders do the
            follow-up.
          </p>
          
          <div className="hero-cta-group" data-reveal="fade-up" data-delay="400">
            <a href={site.registerUrl} className="btn btn-primary">
              Start free trial <Icon name="arrowRight" className="icon-sm" />
            </a>
            <button
              ref={primaryDemoButtonRef}
              type="button"
              className="btn btn-ghost"
              onClick={() => setIsDemoOpen(true)}
            >
              Watch 90-second demo <Icon name="play" className="icon-sm" />
            </button>
          </div>
          
          <p className="hero-social-proof" data-reveal="fade-up" data-delay="500">
            5-star rated. 4.9/5 from 200+ reviews.{" "}
            <a href={site.googleAuthUrl}>Continue with Google</a>.
            No credit card required.
          </p>

          <div className="dashboard-mockup" data-reveal="scale-up" data-delay="600">
            <div className="mockup-topbar">
              <div className="mockup-topbar-left">
                <strong style={{ color: 'white', fontFamily: 'var(--font-display)', fontSize: '14px' }}>Dashboard</strong>
              </div>
              <div className="mockup-topbar-actions">
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginRight: '8px' }}>
                  <Icon name="bell" className="icon-xs" style={{ color: 'var(--color-muted)' }} />
                  <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--color-red)', color: 'white', fontSize: '9px', fontWeight: 800, padding: '2px 4px', borderRadius: '99px', lineHeight: 1 }}>
                    {notifCount}
                  </span>
                </div>
                <div className="mockup-selector">
                  <Icon name="dollarSign" className="icon-xs" />
                  <span>USD</span>
                </div>
                <div className="mockup-profile">
                  <strong>Ahmed M.</strong>
                  <div className="mockup-avatar">AM</div>
                </div>
              </div>
            </div>
            <div className="mockup-grid">
              <div className="mockup-card">
                <small>This month</small>
                <strong><AnimatedCount value={8420} /></strong>
              </div>
              <div className="mockup-card">
                <small>Outstanding</small>
                <strong><AnimatedCount value={2150} /></strong>
              </div>
              <div className="mockup-card">
                <small>Overdue</small>
                <strong><AnimatedCount value={0} /></strong>
              </div>
              <div className="mockup-card">
                <small>All-time</small>
                <strong><AnimatedCount value={42900} /></strong>
              </div>
            </div>
            <div className="mockup-body">
              <div className="mockup-chart">
                <span style={{ height: "42%" }} />
                <span style={{ height: "70%" }} />
                <span style={{ height: "52%" }} />
                <span style={{ height: "84%" }} />
                <span style={{ height: "63%" }} />
              </div>
              <div className="mockup-list">
                <div>
                  <strong style={{ color: 'white' }}>INV-041</strong>
                  <span style={{ color: 'var(--color-amber)' }}>PAID</span>
                </div>
                <div>
                  <strong style={{ color: 'white' }}>INV-042</strong>
                  <span style={{ color: 'var(--color-brand-glow)' }}>SENT</span>
                </div>
                <div>
                  <strong style={{ color: 'white' }}>INV-043</strong>
                  <span style={{ color: 'var(--color-red)' }}>OVERDUE</span>
                </div>
              </div>
            </div>
          </div>

          <div className="payment-logos" data-reveal="fade-up" data-delay="700">
            <span>Accepts payments via</span>
            <span className="payment-logo-pill">Stripe</span>
            <span className="payment-logo-pill">Visa</span>
            <span className="payment-logo-pill">Mastercard</span>
            <span className="payment-logo-pill">EasyPaisa</span>
            <span className="payment-logo-pill">JazzCash</span>
          </div>

        </div>

        {isDemoOpen ? (
          <div className="modal-backdrop" onClick={() => setIsDemoOpen(false)}>
            <div className="demo-modal" onClick={(e) => e.stopPropagation()}>
              <button ref={closeButtonRef} className="modal-close" onClick={() => setIsDemoOpen(false)}>
                <Icon name="x" className="icon-sm" />
              </button>
              <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>See how InvoMir works.</h2>
              <div style={{ background: 'var(--color-bg)', padding: '40px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                <Icon name="play" style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: 'var(--color-brand)' }} />
                <p>Official demo video embed placeholder</p>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
