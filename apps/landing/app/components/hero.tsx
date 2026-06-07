"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import { site } from "../lib/site";

const notificationTargetCount = 50;
const notificationCountDurationMs = 1800;

export function Hero() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const primaryDemoButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isDemoOpen) {
      return;
    }

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
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-inner">
        <span className="badge badge-primary hero-badge">
          Trusted by 500+ freelancers in 20+ countries
        </span>
        <h1 id="hero-title" className="hero-headline">
          Get paid.
          <br />
          <span className="accent-word">Automatically.</span>
        </h1>
        <p className="hero-sub">
          InvoMir turns invoice creation into a 2-minute task, then chases your clients for you.
          Send professional invoices, accept online payments, and let automated reminders do the
          follow-up.
        </p>
        <div className="hero-cta">
          <a href={site.registerUrl} className="btn btn-primary btn-xl">
            Start free trial - it&apos;s free forever <Icon name="arrowRight" className="icon-sm" />
          </a>
          <button
            ref={primaryDemoButtonRef}
            type="button"
            className="btn btn-secondary btn-xl"
            onClick={() => setIsDemoOpen(true)}
          >
            Watch 90-second demo <Icon name="play" className="icon-sm" />
          </button>
        </div>
        <p
          className="hero-social-proof"
          aria-label="4.9 out of 5 from more than 200 reviews. No credit card required."
        >
          5-star rated. 4.9/5 from 200+ reviews. No credit card required.
        </p>

        <div className="hero-screenshot" aria-label="InvoMir dashboard preview">
          <DashboardMockup />
          <div className="floating-card floating-card-paid">
            Invoice INV-042 - Ahmed Khan - $1,500 - PAID
          </div>
          <div className="floating-card floating-card-remind">Reminder sent automatically</div>
          <div className="floating-card floating-card-paid2">Payment received: $2,400</div>
        </div>
      </div>

      {isDemoOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setIsDemoOpen(false)}
        >
          <div
            className="demo-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              type="button"
              className="modal-close"
              aria-label="Close demo"
              onClick={() => {
                setIsDemoOpen(false);
                primaryDemoButtonRef.current?.focus();
              }}
            >
              <Icon name="x" className="icon-sm" />
            </button>
            <span className="section-label">90-second demo</span>
            <h2 id="demo-title">See how InvoMir sends and follows up on an invoice.</h2>
            <div className="demo-frame">
              <div>
                <Icon name="play" className="demo-play-icon" />
                <p>Official demo video embed placeholder</p>
              </div>
            </div>
            <p className="modal-note">
              Add the YouTube or Loom embed URL here when the official demo is published.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function NotificationCountBadge() {
  const [count, setCount] = useState(0);
  const badgeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const badgeElement = badgeRef.current;

    if (!badgeElement) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrame = 0;
    let isAnimating = false;

    const stopCount = () => {
      isAnimating = false;
      window.cancelAnimationFrame(animationFrame);
    };

    const startCount = () => {
      if (isAnimating) {
        return;
      }

      stopCount();
      isAnimating = true;

      animationFrame = window.requestAnimationFrame((startedAt) => {
        setCount(0);

        if (prefersReducedMotion) {
          setCount(notificationTargetCount);
          isAnimating = false;
          return;
        }

        const animateCount = (currentTime: number) => {
          const progress = Math.min((currentTime - startedAt) / notificationCountDurationMs, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(easedProgress * notificationTargetCount));

          if (progress < 1) {
            animationFrame = window.requestAnimationFrame(animateCount);
            return;
          }

          isAnimating = false;
        };

        animationFrame = window.requestAnimationFrame(animateCount);
      });
    };

    if (!("IntersectionObserver" in window)) {
      startCount();

      return () => {
        stopCount();
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          startCount();
          return;
        }

        stopCount();
        setCount(0);
      },
      { threshold: 0.7 },
    );

    observer.observe(badgeElement);

    return () => {
      observer.disconnect();
      stopCount();
    };
  }, []);

  return (
    <div ref={badgeRef} className="mockup-notification" aria-label={`${count} unread notifications`}>
      <Icon name="bell" className="icon-xs" />
      <span className="mockup-notification-badge" aria-hidden="true">
        {count}
      </span>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="dashboard-mockup">
      <div className="mockup-topbar">
        <span className="mockup-dot" />
        <strong>Dashboard</strong>
        <div className="mockup-topbar-actions" aria-label="Dashboard controls preview">
          <div className="mockup-selector">
            <Icon name="globe" className="icon-xs" />
            <span>English</span>
            <Icon name="chevronDown" className="icon-xs" />
          </div>
          <div className="mockup-selector">
            <Icon name="dollarSign" className="icon-xs" />
            <span>USD</span>
            <Icon name="chevronDown" className="icon-xs" />
          </div>
          <NotificationCountBadge />
          <div className="mockup-profile">
            <div className="mockup-profile-copy">
              <strong>Ahmed M.</strong>
              <span>Owner</span>
            </div>
            <div className="mockup-avatar" aria-hidden="true">
              AM
            </div>
          </div>
        </div>
      </div>
      <div className="mockup-grid">
        {[
          ["This month", "$8,420"],
          ["Outstanding", "$2,150"],
          ["Overdue", "$0"],
          ["All-time revenue", "$42,900"],
        ].map(([label, value]) => (
          <div className="mockup-card" key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        ))}
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
            <strong>INV-041</strong>
            <span>Paid</span>
          </div>
          <div>
            <strong>INV-042</strong>
            <span>Viewed</span>
          </div>
          <div>
            <strong>INV-043</strong>
            <span>Sent</span>
          </div>
        </div>
      </div>
    </div>
  );
}
