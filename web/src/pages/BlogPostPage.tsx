import { useParams, Link, Navigate } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import SEO from "@/components/seo/SEO";
import { blogPostJsonLd, breadcrumbJsonLd } from "@/components/seo/structured-data";
import { getPostBySlug, getRelatedPosts, getAllCategories, getAllPosts, SITE_URL } from "@/lib/blog";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) return <Navigate to="/blog" replace />;

  const post = getPostBySlug(slug);
  if (!post) return <Navigate to="/blog" replace />;

  const related = getRelatedPosts(slug, 3);
  const categoryName =
    getAllCategories().find((c) => c.slug === post.category)?.name ?? post.category;

  // Previous/next navigation
  const allPosts = getAllPosts();
  const currentIdx = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIdx < allPosts.length - 1 ? allPosts[currentIdx + 1] : null;
  const nextPost = currentIdx > 0 ? allPosts[currentIdx - 1] : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <SEO
        title={post.title}
        description={post.description}
        canonical={`/blog/${post.slug}`}
        ogType="article"
        jsonLd={[
          blogPostJsonLd({
            slug: post.slug,
            title: post.title,
            description: post.description,
            date: post.date,
            author: post.author,
            image: post.image,
          }),
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Blog", url: "/blog" },
            { name: categoryName, url: `/blog?category=${post.category}` },
            { name: post.title, url: `/blog/${post.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.description,
            image: post.image ? `${SITE_URL}${post.image}` : undefined,
            datePublished: post.date,
            author: {
              "@type": "Person",
              name: post.author,
            },
            publisher: {
              "@type": "Organization",
              name: "RailsKit",
              url: SITE_URL,
            },
            mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
          },
        ]}
      />

      <header className="border-b border-zinc-800">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <Link
            to="/blog"
            className="text-sm text-zinc-400 hover:text-white transition"
          >
            ← All posts
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        {/* Post meta */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <time>{post.date}</time>
            <span className="text-zinc-700">·</span>
            <span>{post.readingTime} min read</span>
            <span className="text-zinc-700">·</span>
            <Link
              to={`/blog?category=${post.category}`}
              className="text-indigo-400/70 hover:text-indigo-400 transition"
            >
              {categoryName}
            </Link>
          </div>
          <span className="text-sm text-zinc-500">{post.author}</span>
        </div>

        {/* Post content */}
        <article className="prose prose-invert prose-zinc max-w-none prose-headings:font-semibold prose-a:text-indigo-400 prose-code:bg-zinc-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {post.content}
          </ReactMarkdown>
        </article>

        {/* Tags */}
        {post.tags.length > 0 && (
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

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-12 pt-6 border-t border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-300">Related Posts</h2>
            <div className="mt-6 space-y-6">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/blog/${r.slug}`}
                  className="block group"
                >
                  <time className="text-sm text-zinc-500">{r.date}</time>
                  <h3 className="mt-0.5 font-medium group-hover:text-indigo-400 transition">
                    {r.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
                    {r.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
