import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import SEO from "@/components/seo/SEO";
import { breadcrumbJsonLd } from "@/components/seo/structured-data";
import { sortedPosts, BLOG_CATEGORIES } from "@/content/blog";
import { Rss } from "lucide-react";

export default function BlogIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";
  const activeTag = searchParams.get("tag") || null;

  const filtered = sortedPosts.filter((post) => {
    if (activeCategory !== "all" && post.category !== activeCategory) return false;
    if (activeTag && !post.tags.includes(activeTag)) return false;
    return true;
  });

  function setCategory(cat: string) {
    const params = new URLSearchParams(searchParams);
    if (cat === "all") params.delete("category");
    else params.set("category", cat);
    setSearchParams(params);
  }

  function setTag(tag: string | null) {
    const params = new URLSearchParams(searchParams);
    if (tag) params.set("tag", tag);
    else params.delete("tag");
    setSearchParams(params);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <SEO
        title="Blog"
        description="Guides, tutorials, and insights on building AI-powered Rails applications with RailsKit."
        canonical="/blog"
        jsonLd={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
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
        <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
        <p className="mt-3 text-lg text-zinc-400">
          Guides, tutorials, and opinions on shipping AI-powered Rails apps.
        </p>

        {/* Category filters */}
        <div className="mt-8 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("all")}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              activeCategory === "all"
                ? "bg-white text-zinc-900 border-white"
                : "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
            }`}
          >
            All
          </button>
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                activeCategory === cat
                  ? "bg-white text-zinc-900 border-white"
                  : "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
              }`}
            >
              {cat}
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

        {/* Posts */}
        <div className="mt-10 space-y-10">
          {filtered.length === 0 ? (
            <p className="text-zinc-500 py-8 text-center">No posts found for this filter.</p>
          ) : (
            filtered.map((post) => (
              <article key={post.slug} className="group">
                <Link to={`/blog/${post.slug}`} className="block">
                  <div className="flex items-center gap-3 text-sm">
                    <time className="text-zinc-500">{post.date}</time>
                    <span className="text-zinc-700">·</span>
                    <span className="text-zinc-500">{post.category}</span>
                    {post.featured && (
                      <>
                        <span className="text-zinc-700">·</span>
                        <span className="text-amber-400 text-xs font-medium">Featured</span>
                      </>
                    )}
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
