import type { ReactNode } from "react";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <section className="page-hero">
      <div className="section-inner page-hero-inner">
        <span className="section-label">{eyebrow}</span>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
        {children}
      </div>
    </section>
  );
}

