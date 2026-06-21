"use client";

import Link from "next/link";
import { Icon } from "./icons";
import { footerGroups, site } from "../lib/site";

export function Footer() {
  return (
    <footer className="site-footer" style={{ background: '#0A0B0F', borderTop: '1px solid #1F2937' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .site-footer { padding: 60px 20px 40px; }
        @media (min-width: 1024px) { .site-footer { padding: 80px 80px 40px; } }
        
        .footer-inner {
          width: min(100%, 1200px); margin: 0 auto;
          display: grid; grid-template-columns: 1fr; gap: 48px;
        }
        @media (min-width: 1024px) {
          .footer-inner { grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 32px; }
        }

        .footer-brand .footer-logo {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-display); font-weight: 700; font-size: 16px; color: white;
        }
        .footer-brand .footer-logo::before {
          content: ''; display: block; width: 6px; height: 6px;
          background: var(--color-brand); border-radius: 50%; box-shadow: 0 0 8px var(--color-brand);
        }
        .footer-tagline { font-family: var(--font-body); font-size: 13px; color: var(--color-muted); font-style: italic; margin-top: 4px; }
        .footer-desc { font-family: var(--font-body); font-size: 13px; color: var(--color-muted); line-height: 1.6; margin-top: 12px; max-width: 220px; }
        
        .footer-social { display: flex; gap: 16px; margin-top: 20px; }
        .footer-social a { color: var(--color-muted); transition: color 0.2s, transform 0.2s; }
        .footer-social a:hover { color: white; transform: translateY(-2px); }

        .footer-col-title { font-family: var(--font-body); font-size: 12px; font-weight: 600; color: white; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; }
        .footer-col ul { list-style: none; padding: 0; margin: 0; }
        .footer-col li { margin-bottom: 8px; }
        .footer-col a { font-family: var(--font-body); font-size: 13px; color: var(--color-muted); line-height: 2; transition: color 0.2s; position: relative; }
        .footer-col a:hover { color: white; }
        .footer-col a::after {
          content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 1px;
          background: var(--color-brand); transform: scaleX(0); transform-origin: left; transition: transform 0.25s ease;
        }
        .footer-col a:hover::after { transform: scaleX(1); }

        .footer-bottom {
          width: min(100%, 1200px); margin: 40px auto 0; padding-top: 24px;
          border-top: 1px solid var(--color-border);
          display: flex; flex-direction: column; align-items: center; gap: 16px;
        }
        @media (min-width: 768px) {
          .footer-bottom { flex-direction: row; justify-content: space-between; }
        }
        .footer-bottom p { font-family: var(--font-body); font-size: 12px; color: var(--color-muted); }
      `}} />
      <div className="footer-inner">
        <div className="footer-brand" data-reveal="fade-up">
          <Link href="/" className="footer-logo" aria-label="InvoMir Home">
            InvoMir
          </Link>
          <p className="footer-tagline">Get paid. Automatically.</p>
          <p className="footer-desc">
            The invoicing platform for freelancers who want to get paid without the hassle.
          </p>
          <div className="footer-social">
            <a href={site.twitterUrl} aria-label="Twitter"><Icon name="twitter" className="icon-sm" /></a>
            <a href={site.linkedInUrl} aria-label="LinkedIn"><Icon name="linkedin" className="icon-sm" /></a>
            <a href={site.youtubeUrl} aria-label="Instagram"><Icon name="instagram" className="icon-sm" /></a>
          </div>
        </div>

        {footerGroups.map((group, index) => (
          <div className="footer-col" key={group.title} data-reveal="fade-up" data-delay={(index + 1) * 100}>
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
      </div>

      <div className="footer-bottom" data-reveal="fade">
        <p>© 2026 InvoMir. All rights reserved.</p>
        <p>Made with <span style={{ color: '#6366F1' }}>♥</span> for freelancers worldwide</p>
      </div>
    </footer>
  );
}
