"use client";

import { useEffect } from "react";

const DEFAULTS = {
  threshold: 0.15,
  rootMargin: "0px 0px -60px 0px",
  once: true,
};

export function ScrollReveal() {
  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll("[data-reveal]").forEach((el) => {
        el.classList.add("in-view");
      });
      return;
    }

    const applyDelay = (el: Element) => {
      const htmlEl = el as HTMLElement;
      const delay = htmlEl.dataset.delay;
      if (delay !== undefined) {
        htmlEl.style.transitionDelay = `${delay}ms`;
      }
    };

    const reveal = (el: Element) => {
      el.classList.add("in-view");
      el.dispatchEvent(new CustomEvent("invomir:revealed", { bubbles: true }));
    };

    const hide = (el: Element) => {
      el.classList.remove("in-view");
    };

    const animateCount = (el: Element) => {
      const htmlEl = el as HTMLElement;
      const target = parseInt(htmlEl.dataset.countTo || "0", 10);
      const suffix = htmlEl.dataset.suffix || "";
      const duration = 1200; // ms
      const start = performance.now();

      function step(now: number) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        htmlEl.textContent = Math.round(eased * target).toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          const once = el.dataset.revealOnce !== "false"; // default true

          if (entry.isIntersecting) {
            reveal(el);

            // Trigger count-up if this element is a stat number
            if (el.classList.contains("stat-number") && el.dataset.countTo) {
              animateCount(el);
            }

            if (once) obs.unobserve(el);
          } else if (!once) {
            hide(el);
          }
        });
      },
      {
        threshold: DEFAULTS.threshold,
        rootMargin: DEFAULTS.rootMargin,
      }
    );

    const targets = document.querySelectorAll("[data-reveal]");

    targets.forEach((el) => {
      applyDelay(el);
      observer.observe(el);
    });

    // Also watch .reveal-line elements
    document.querySelectorAll(".reveal-line").forEach((el) => observer.observe(el));

    // Also watch .stat-number elements (for count animation)
    document.querySelectorAll(".stat-number").forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
