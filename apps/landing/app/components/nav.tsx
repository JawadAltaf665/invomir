"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { primaryNavItems, resourceNavItems, site } from "../lib/site";

interface CurrentUserResponse {
  data?: {
    firstName?: string | null;
  } | null;
}

export function Nav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

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

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as CurrentUserResponse;
        const resolvedFirstName = payload.data?.firstName?.trim();

        if (resolvedFirstName) {
          setFirstName(resolvedFirstName);
        }
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
    <header className={`site-header ${isScrolled ? "scrolled" : ""}`}>
      <nav className="nav-inner" aria-label="Primary navigation">
        <Link href="/" className="nav-logo" aria-label="Invomir Home">
          <Image src="/assets/logo/invomir-icon.svg" alt="" width={36} height={36} priority />
          <span className="nav-logo-text">Invomir</span>
        </Link>

        <ul className="nav-links" role="list">
          {primaryNavItems.map((item) => (
            <li key={item.href}>
              <Link className="nav-link" href={item.href}>
                {item.label}
              </Link>
            </li>
          ))}
          <li className="nav-dropdown-wrap">
            <button
              className="nav-link nav-dropdown-trigger"
              type="button"
              aria-expanded={isResourcesOpen}
              aria-haspopup="true"
              onClick={() => setIsResourcesOpen((value) => !value)}
            >
              Resources <Icon name="chevronDown" className="icon-xs" />
            </button>
            <div className={`nav-dropdown ${isResourcesOpen ? "open" : ""}`} role="menu">
              {resourceNavItems.map((item) => (
                <Link key={item.href} href={item.href} className="dropdown-item" role="menuitem">
                  {item.label}
                </Link>
              ))}
            </div>
          </li>
        </ul>

        <div className="nav-cta">
          {firstName ? (
            <>
              <span className="nav-welcome">Hi, {firstName}</span>
              <a href={site.dashboardUrl} className="btn btn-primary btn-sm">
                Go to dashboard <Icon name="arrowRight" className="icon-xs" />
              </a>
            </>
          ) : (
            <>
              <a href={site.loginUrl} className="btn btn-ghost btn-sm">
                Log in
              </a>
              <a href={site.registerUrl} className="btn btn-primary btn-sm">
                Start free trial
              </a>
            </>
          )}
        </div>

        <button
          className="nav-hamburger"
          type="button"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          onClick={() => setIsMenuOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <div id="mobile-menu" className={`mobile-menu ${isMenuOpen ? "open" : ""}`} aria-hidden={!isMenuOpen}>
        <ul role="list">
          {[...primaryNavItems, ...resourceNavItems].map((item) => (
            <li key={item.href}>
              <Link href={item.href} onClick={closeMobileMenu}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mobile-menu-cta">
          <a href={site.loginUrl} className="btn btn-secondary">
            Log in
          </a>
          <a href={site.registerUrl} className="btn btn-primary">
            Start free trial
          </a>
        </div>
      </div>
    </header>
  );
}
