import Link from "next/link";
import Image from "next/image";
import { Icon } from "./icons";
import { footerGroups, site } from "../lib/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link href="/" className="footer-logo" aria-label="InvoMir Home">
            <Image src="/assets/logo/invomir-logo-white.svg" alt="InvoMir" width={120} height={32} />
          </Link>
          <p className="footer-tagline">Get paid. Automatically.</p>
          <p className="footer-desc">
            InvoMir helps freelancers and small businesses create invoices, accept online payments,
            and collect automatically.
          </p>
          <div className="footer-social">
            <a href={site.twitterUrl} aria-label="Twitter">
              X
            </a>
            <a href={site.linkedInUrl} aria-label="LinkedIn">
              in
            </a>
            <a href={site.youtubeUrl} aria-label="YouTube">
              play
            </a>
          </div>
        </div>

        {footerGroups.map((group) => (
          <div className="footer-col" key={group.title}>
            <h4 className="footer-col-title">{group.title}</h4>
            <ul>
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="footer-col footer-cta-col">
          <h4 className="footer-col-title">Get started free</h4>
          <p>No credit card required. Full features for 14 days.</p>
          <a href={site.registerUrl} className="btn btn-primary btn-sm">
            Start free trial <Icon name="arrowRight" className="icon-xs" />
          </a>
          <div className="footer-auth-link">
            Already have an account? <a href={site.loginUrl}>Log in</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>Copyright 2026 InvoMir. All rights reserved. Built by Jawad Altaf.</p>
        <div className="footer-bottom-links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/security">Security</Link>
        </div>
      </div>
    </footer>
  );
}
