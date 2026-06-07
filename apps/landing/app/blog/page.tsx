import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "../components/page-hero";
import { blogPosts } from "../lib/content";
import { site } from "../lib/site";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides for invoicing clients, getting paid faster, and running a small service business with less payment follow-up.",
  alternates: {
    canonical: `${site.marketingUrl}/blog`,
  },
};

export default function BlogPage() {
  const [featuredPost, ...latestPosts] = blogPosts;
  const categories = [...new Set(blogPosts.map((post) => post.category))];

  return (
    <main id="main-content">
      <PageHero
        eyebrow="Blog"
        title="Practical guides for getting paid faster."
        description="Invoicing guides, freelancer finance tips, and product updates for people who want less chasing."
      />
      <section className="section blog-index-section">
        <div className="section-inner">
          <div className="blog-index-header">
            <div>
              <span className="section-label">Featured guide</span>
              <h2 className="section-title">Start with the guide most teams need first.</h2>
            </div>
            <div className="blog-category-strip" aria-label="Blog categories">
              {categories.map((category) => (
                <span key={category}>{category}</span>
              ))}
            </div>
          </div>

          <article className="blog-featured-card card">
            <Link href={`/blog/${featuredPost.slug}`} className="blog-featured-cover" aria-label={featuredPost.title}>
              <span>{featuredPost.category}</span>
            </Link>
            <div className="blog-featured-body">
              <span className="badge badge-primary">{featuredPost.category}</span>
              <h2>
                <Link href={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
              </h2>
              <p>{featuredPost.excerpt}</p>
              <div className="blog-meta">
                <span>Jawad Altaf</span>
                <span>{featuredPost.date}</span>
                <span>{featuredPost.readTime}</span>
              </div>
              <Link className="blog-read-link" href={`/blog/${featuredPost.slug}`}>
                Read guide <span aria-hidden="true">-&gt;</span>
              </Link>
            </div>
          </article>

          <div className="blog-list-header">
            <span className="section-label">Latest articles</span>
            <h2>More ways to invoice with confidence.</h2>
          </div>

          <div className="blog-grid">
            {latestPosts.map((post) => (
              <article className="blog-card card" key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="blog-cover" aria-label={post.title}>
                  <span>{post.category}</span>
                </Link>
                <div className="blog-card-body">
                  <span className="badge badge-muted">{post.category}</span>
                  <h2>
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p>{post.excerpt}</p>
                  <div className="blog-meta">
                    <span>Jawad Altaf</span>
                    <span>{post.date}</span>
                    <span>{post.readTime}</span>
                  </div>
                  <Link className="blog-read-link" href={`/blog/${post.slug}`}>
                    Read guide <span aria-hidden="true">-&gt;</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
