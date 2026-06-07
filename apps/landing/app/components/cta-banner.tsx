import Link from "next/link";
import { Icon } from "./icons";
import { site } from "../lib/site";

export function CtaBanner() {
  return (
    <section className="section final-cta" aria-labelledby="cta-banner-title">
      <div className="final-cta-inner">
        <h2 id="cta-banner-title">Stop waiting to get paid.</h2>
        <p>Join 500+ freelancers who use InvoMir to get paid faster, automatically.</p>
        <div className="hero-cta">
          <a href={site.registerUrl} className="btn btn-light btn-xl">
            Start free trial - no card needed
          </a>
          <Link href="/pricing" className="btn btn-outline-light btn-xl">
            See pricing <Icon name="arrowRight" className="icon-sm" />
          </Link>
        </div>
      </div>
    </section>
  );
}

