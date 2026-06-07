import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "../../lib/content";
import { site } from "../../lib/site";

interface BlogArticlePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.excerpt,
    keywords: [post.keyword],
    alternates: {
      canonical: `${site.marketingUrl}/blog/${post.slug}`,
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `${site.marketingUrl}/blog/${post.slug}`,
    },
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    notFound();
  }

  const related = blogPosts.filter((item) => item.slug !== post.slug).slice(0, 3);

  return (
    <main id="main-content">
      <article>
        <header className="article-hero">
          <div className="section-inner article-hero-inner">
            <div className="article-hero-copy">
              <span className="section-label">{post.category}</span>
              <h1>{post.title}</h1>
              <p>{post.excerpt}</p>
              <div className="article-author-card">
                <span className="article-author-avatar" aria-hidden="true">
                  JA
                </span>
                <div className="blog-meta article-meta">
                  <span>Jawad Altaf</span>
                  <span>{post.date}</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </div>
            <div className="article-cover" aria-hidden="true">
              <div className="article-cover-toolbar">
                <span />
                <span />
                <span />
              </div>
              <div className="article-cover-card article-cover-card-main">
                <small>Guide</small>
                <strong>{post.category}</strong>
                <p>{post.keyword}</p>
              </div>
              <div className="article-cover-card article-cover-card-note">
                <small>Read time</small>
                <strong>{post.readTime}</strong>
              </div>
            </div>
          </div>
        </header>
        <div className="section article-layout">
          <div className="section-inner article-grid">
            <aside className="toc" aria-label="Table of contents">
              <strong>In this guide</strong>
              <ol>
                {post.sections.map((section) => (
                  <li key={section.heading}>
                    <a href={`#${slugify(section.heading)}`}>{section.heading}</a>
                  </li>
                ))}
              </ol>
            </aside>
            <div className="article-body">
              {post.sections.map((section) => (
                <section id={slugify(section.heading)} key={section.heading}>
                  <h2>{section.heading}</h2>
                  <p>{section.body}</p>
                </section>
              ))}
              <div className="article-callout">
                <h2>Try InvoMir for your next invoice</h2>
                <p>Create the client, send the invoice, and let automatic reminders handle follow-up.</p>
                <a href={site.registerUrl} className="btn btn-primary">
                  Start free trial
                </a>
              </div>
            </div>
          </div>
        </div>
      </article>
      <section className="section related-section" aria-labelledby="related-title">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-label">Related articles</span>
            <h2 id="related-title" className="section-title">
              Keep reading
            </h2>
          </div>
          <div className="related-grid">
            {related.map((item) => (
              <Link className="card related-card" href={`/blog/${item.slug}`} key={item.slug}>
                <span className="badge badge-muted">{item.category}</span>
                <strong>{item.title}</strong>
                <p>{item.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
