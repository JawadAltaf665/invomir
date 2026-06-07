import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content">
      <section className="page-hero">
        <div className="section-inner page-hero-inner">
          <span className="section-label">404</span>
          <h1>Page not found</h1>
          <p>The page you opened does not exist on the InvoMir marketing site.</p>
          <Link href="/" className="btn btn-primary">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}

