import { useParams, Link, Navigate } from "react-router";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SEO from "@/components/seo/SEO";
import { blogPostJsonLd, breadcrumbJsonLd } from "@/components/seo/structured-data";
import { blogPosts } from "@/content/blog";

// Vite glob import for all .md files in content/blog
const markdownModules = import.meta.glob("/src/content/blog/*.md", {
  query: "?raw",
  import: "default",
});

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const post = blogPosts.find((p) => p.slug === slug);

  useEffect(() => {
    if (!slug) return;
    const key = `/src/content/blog/${slug}.md`;
    const loader = markdownModules[key];
    if (loader) {
      (loader() as Promise<string>).then((md) => {
        setContent(md);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [slug]);

  if (!loading && (!post || content === null)) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {post && (
        <SEO
          title={post.title}
          description={post.description}
          canonical={`/blog/${post.slug}`}
          ogType="article"
          jsonLd={[
            blogPostJsonLd(post),
            breadcrumbJsonLd([
              { name: "Home", url: "/" },
              { name: "Blog", url: "/blog" },
              { name: post.title, url: `/blog/${post.slug}` },
            ]),
          ]}
        />
      )}

      <header className="border-b border-zinc-800">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <Link to="/blog" className="text-sm text-zinc-400 hover:text-white transition">
            ← All posts
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        {loading ? (
          <div className="text-zinc-500">Loading…</div>
        ) : (
          <article className="prose prose-invert prose-zinc max-w-none prose-headings:font-semibold prose-a:text-indigo-400 prose-code:bg-zinc-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800">
            {post && (
              <div className="not-prose mb-8">
                <time className="text-sm text-zinc-500">{post.date}</time>
                <span className="mx-2 text-zinc-700">·</span>
                <span className="text-sm text-zinc-500">{post.author}</span>
              </div>
            )}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content!}</ReactMarkdown>
          </article>
        )}
      </main>
    </div>
  );
}
