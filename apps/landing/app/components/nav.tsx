"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { primaryNavItems, site } from "../lib/site";

interface CurrentUserResponse {
  data?: {
    firstName?: string | null;
  } | null;
}

export function Nav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2000);

    async function checkAuthState() {
      try {
        const response = await fetch(`${site.appUrl}/api/users/me`, {
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const payload = (await response.json()) as CurrentUserResponse;
        const resolvedFirstName = payload.data?.firstName?.trim();
        if (resolvedFirstName) setFirstName(resolvedFirstName);
      } catch {
        setFirstName(null);
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void checkAuthState();
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const closeMobileMenu = () => setIsMenuOpen(false);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .site-header {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          height: 64px; display: flex; align-items: center;
          border-bottom: 1px solid transparent;
          transition: background 0.3s ease, border-color 0.3s ease;
        }
        .site-header.scrolled {
          background: rgba(10, 11, 15, 0.85);
          backdrop-filter: blur(20px) saturate(180%);
          border-bottom-color: var(--color-border);
        }
        .nav-inner {
          width: min(100%, 1200px); margin: 0 auto; padding: 0 20px;
          display: flex; align-items: center; justify-content: space-between;
        }
        @media (min-width: 1024px) {
          .nav-inner { padding: 0 80px; }
        }
        .nav-logo {
          display: flex; align-items: center; gap: 8px; font-family: var(--font-display);
          font-weight: 700; font-size: 18px; color: white;
        }
        .nav-logo::before {
          content: ''; display: block; width: 6px; height: 6px;
          background: var(--color-brand); border-radius: 50%;
          box-shadow: 0 0 8px var(--color-brand);
        }
        .nav-links {
          display: none; list-style: none; margin: 0; padding: 0; gap: 32px;
        }
        @media (min-width: 768px) {
          .nav-links { display: flex; align-items: center; }
        }
        .nav-link {
          font-size: 14px; font-weight: 500; color: var(--color-muted);
          position: relative; transition: color var(--transition-fast);
        }
        .nav-link:hover { color: white; }
        .nav-link::after {
          content: ''; position: absolute; bottom: -4px; left: 0; width: 100%; height: 2px;
          background: var(--color-brand); transform: scaleX(0); transform-origin: left;
          transition: transform 0.25s ease;
        }
        .nav-link:hover::after { transform: scaleX(1); }
        .nav-cta {
          display: none; align-items: center; gap: 12px;
        }
        @media (min-width: 768px) {
          .nav-cta { display: flex; }
        }
        .nav-cta .btn { min-height: 40px; padding: 0 16px; font-size: 14px; }
        .hamburger {
          display: flex; flex-direction: column; justify-content: center; gap: 4px;
          width: 24px; height: 24px; background: none; border: none; padding: 0; cursor: pointer;
        }
        @media (min-width: 768px) {
          .hamburger { display: none; }
        }
        .hamburger span {
          display: block; width: 100%; height: 2px; background: white;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }
        .hamburger.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
        .hamburger.open span:nth-child(2) { opacity: 0; }
        .hamburger.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }
        
        .mobile-drawer {
          position: fixed; top: 64px; left: 0; width: 100vw; height: calc(100vh - 64px);
          background: var(--color-bg); z-index: 99; padding: 20px;
          border-top: 1px solid var(--color-border);
          display: flex; flex-direction: column;
          transform: translateY(-100%); opacity: 0; pointer-events: none;
          transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease;
        }
        .mobile-drawer.open {
          transform: translateY(0); opacity: 1; pointer-events: auto;
        }
        .mobile-drawer-links {
          list-style: none; padding: 0; margin: 0 0 32px 0;
        }
        .mobile-drawer-links li a {
          display: block; padding: 20px 0; font-size: 16px; font-weight: 500; color: white;
          border-bottom: 1px solid var(--color-border);
        }
        .mobile-drawer-cta { display: flex; flex-direction: column; gap: 16px; }
      `}} />

      <header className={`site-header ${isScrolled ? "scrolled" : ""}`} style={{ animation: "fadeIn 0.4s ease 0.1s both" }}>
        <nav className="nav-inner" aria-label="Primary navigation">
          <Link href="/" className="nav-logo" aria-label="Invomir Home" onClick={closeMobileMenu}>
            InvoMir
          </Link>

          <ul className="nav-links" role="list">
            {primaryNavItems.map((item) => (
              <li key={item.href}>
                <Link className="nav-link" href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="nav-cta">
            {firstName ? (
              <>
                <span style={{ fontSize: '14px', color: 'var(--color-muted)' }}>Hi, {firstName}</span>
                <a href={site.dashboardUrl} className="btn btn-primary">
                  Dashboard <Icon name="arrowRight" className="icon-xs" />
                </a>
              </>
            ) : (
              <>
                <a href={site.loginUrl} className="btn btn-ghost">Sign In</a>
                <a href={site.registerUrl} className="btn btn-primary">Start Free</a>
              </>
            )}
          </div>

          <button
            className={`hamburger ${isMenuOpen ? "open" : ""}`}
            type="button"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span />
            <span />
            <span />
          </button>
        </nav>
      </header>

      <div className={`mobile-drawer ${isMenuOpen ? "open" : ""}`} aria-hidden={!isMenuOpen}>
        <ul className="mobile-drawer-links" role="list">
          {primaryNavItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} onClick={closeMobileMenu}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mobile-drawer-cta">
          {firstName ? (
            <a href={site.dashboardUrl} className="btn btn-primary" onClick={closeMobileMenu}>
              Go to Dashboard
            </a>
          ) : (
            <>
              <a href={site.loginUrl} className="btn btn-ghost" onClick={closeMobileMenu}>Sign In</a>
              <a href={site.registerUrl} className="btn btn-primary" onClick={closeMobileMenu}>Start Free</a>
            </>
          )}
        </div>
      </div>
    </>
  );
}
