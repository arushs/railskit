import { Link, useSearchParams } from "react-router";
import SEO from "@/components/seo/SEO";
import { breadcrumbJsonLd } from "@/components/seo/structured-data";
import { getAllPosts, getAllCategories } from "@/lib/blog";
import { Rss } from "lucide-react";

export default function BlogIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");
  const activeTag = searchParams.get("tag") || null;

  const allPosts = getAllPosts();
  const categories = getAllCategories();

  const posts = allPosts.filter((p) => {
    if (activeCategory && p.category !== activeCategory) return false;
    if (activeTag && !p.tags.includes(activeTag)) return false;
    return true;
  });

  const activeCategoryName = categories.find(
    (c) => c.slug === activeCategory
  )?.name;

  function setTag(tag: string | null) {
    const params = new URLSearchParams(searchParams);
    if (tag) params.set("tag", tag);
    else params.delete("tag");
    setSearchParams(params);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <SEO
        title={activeCategoryName ? `${activeCategoryName} — Blog` : "Blog"}
        description="Guides, tutorials, and insights on building AI-powered Rails applications with RailsKit."
        canonical={activeCategory ? `/blog?category=${activeCategory}` : "/blog"}
        jsonLd={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
          ...(activeCategoryName
            ? [{ name: activeCategoryName, url: `/blog?category=${activeCategory}` }]
            : []),
        ])}
      />

      <header className="border-b border-zinc-800">
        <div className="mx-auto max-w-3xl px-6 py-6 flex items-center justify-between">
          <Link to="/" className="text-sm text-zinc-400 hover:text-white transition">
            ← Back to RailsKit
          </Link>
          <a
            href="/rss.xml"
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-orange-400 transition"
            title="RSS Feed"
          >
            <Rss className="w-4 h-4" />
            RSS
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight">
          {activeCategoryName ? activeCategoryName : "Blog"}
        </h1>
        <p className="mt-3 text-lg text-zinc-400">
          {activeCategoryName
            ? categories.find((c) => c.slug === activeCategory)?.description
            : "Guides, tutorials, and opinions on shipping AI-powered Rails apps."}
        </p>

        {/* Category filter pills */}
        <div className="mt-8 flex flex-wrap gap-2">
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.delete("category");
              setSearchParams(params);
            }}
            className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${
              !activeCategory
                ? "bg-white text-zinc-900 border-white"
                : "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
            }`}
          >
            All ({allPosts.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setSearchParams({ category: cat.slug })}
              className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${
                activeCategory === cat.slug
                  ? "bg-white text-zinc-900 border-white"
                  : "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        {/* Active tag */}
        {activeTag && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-zinc-500">Filtered by tag:</span>
            <button
              onClick={() => setTag(null)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30"
            >
              {activeTag}
              <span className="ml-1">×</span>
            </button>
          </div>
        )}

        {/* Post list */}
        <div className="mt-10 space-y-10">
          {posts.length === 0 ? (
            <p className="text-zinc-500 py-8 text-center">No posts found for this filter.</p>
          ) : (
            posts.map((post) => (
              <article key={post.slug} className="group">
                <Link to={`/blog/${post.slug}`} className="block">
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <time>{post.date}</time>
                    <span className="text-zinc-700">·</span>
                    <span>{post.readingTime} min read</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-indigo-400/70">{
                      categories.find((c) => c.slug === post.category)?.name ?? post.category
                    }</span>
                  </div>
                  <h2 className="mt-2 text-xl font-semibold group-hover:text-indigo-400 transition">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-zinc-400 leading-relaxed">
                    {post.description}
                  </p>
                </Link>
                <div className="mt-3 flex gap-2">
                  {post.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={(e) => {
                        e.preventDefault();
                        setTag(tag);
                      }}
                      className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </main>

      <footer className="border-t border-zinc-800">
        <div className="mx-auto max-w-3xl px-6 py-6 text-center text-sm text-zinc-500">
          <a href="/rss.xml" className="hover:text-zinc-300 transition">RSS Feed</a>
          <span className="mx-2">·</span>
          <a href="/sitemap.xml" className="hover:text-zinc-300 transition">Sitemap</a>
        </div>
      </footer>
    </div>
  );
}
