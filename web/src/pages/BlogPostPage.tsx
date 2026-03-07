import { useParams, Link, Navigate } from "react-router";
import { useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SEO from "@/components/seo/SEO";
import { blogPostJsonLd, breadcrumbJsonLd } from "@/components/seo/structured-data";
import { blogPosts, sortedPosts, readingTime } from "@/content/blog";

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

  // Estimate reading time from markdown content
  const estimatedTime = useMemo(() => {
    if (!content) return null;
    const words = content.split(/\s+/).length;
    return readingTime(words);
  }, [content]);

  // Related posts: same category, excluding current
  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return sortedPosts
      .filter((p) => p.slug !== post.slug && p.category === post.category)
      .slice(0, 3);
  }, [post]);

  // Previous/next navigation
  const currentIdx = sortedPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIdx < sortedPosts.length - 1 ? sortedPosts[currentIdx + 1] : null;
  const nextPost = currentIdx > 0 ? sortedPosts[currentIdx - 1] : null;

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
          <>
            <article className="prose prose-invert prose-zinc max-w-none prose-headings:font-semibold prose-a:text-indigo-400 prose-code:bg-zinc-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800">
              {post && (
                <div className="not-prose mb-8">
                  <div className="flex items-center gap-3 text-sm text-zinc-500">
                    <time>{post.date}</time>
                    <span className="text-zinc-700">·</span>
                    <span>{post.author}</span>
                    {estimatedTime && (
                      <>
                        <span className="text-zinc-700">·</span>
                        <span>{estimatedTime} min read</span>
                      </>
                    )}
                  </div>
                  <Link
                    to={`/blog?category=${encodeURIComponent(post.category)}`}
                    className="mt-3 inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 transition"
                  >
                    {post.category}
                  </Link>
                </div>
              )}
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content!}</ReactMarkdown>
            </article>

            {/* Tags */}
            {post && post.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-zinc-800 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Prev / Next */}
            <nav className="mt-10 pt-6 border-t border-zinc-800 grid grid-cols-2 gap-6">
              <div>
                {prevPost && (
                  <Link to={`/blog/${prevPost.slug}`} className="group block">
                    <span className="text-xs text-zinc-500">← Previous</span>
                    <p className="mt-1 text-sm font-medium group-hover:text-indigo-400 transition">
                      {prevPost.title}
                    </p>
                  </Link>
                )}
              </div>
              <div className="text-right">
                {nextPost && (
                  <Link to={`/blog/${nextPost.slug}`} className="group block">
                    <span className="text-xs text-zinc-500">Next →</span>
                    <p className="mt-1 text-sm font-medium group-hover:text-indigo-400 transition">
                      {nextPost.title}
                    </p>
                  </Link>
                )}
              </div>
            </nav>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-12 pt-6 border-t border-zinc-800">
                <h3 className="text-lg font-semibold">Related Posts</h3>
                <div className="mt-4 space-y-4">
                  {relatedPosts.map((rp) => (
                    <Link
                      key={rp.slug}
                      to={`/blog/${rp.slug}`}
                      className="block group"
                    >
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <time>{rp.date}</time>
                        <span className="text-zinc-700">·</span>
                        <span>{rp.category}</span>
                      </div>
                      <h4 className="mt-1 text-sm font-medium group-hover:text-indigo-400 transition">
                        {rp.title}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
