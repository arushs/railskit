import { Link } from "react-router";
import SEO from "@/components/seo/SEO";
import { breadcrumbJsonLd } from "@/components/seo/structured-data";
import { blogPosts } from "@/content/blog";

export default function BlogIndexPage() {
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
        <div className="mx-auto max-w-3xl px-6 py-6">
          <Link to="/" className="text-sm text-zinc-400 hover:text-white transition">
            ← Back to RailsKit
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
        <p className="mt-3 text-lg text-zinc-400">
          Guides, tutorials, and opinions on shipping AI-powered Rails apps.
        </p>

        <div className="mt-12 space-y-10">
          {blogPosts.map((post) => (
            <article key={post.slug} className="group">
              <Link to={`/blog/${post.slug}`} className="block">
                <time className="text-sm text-zinc-500">{post.date}</time>
                <h2 className="mt-1 text-xl font-semibold group-hover:text-indigo-400 transition">
                  {post.title}
                </h2>
                <p className="mt-2 text-zinc-400 leading-relaxed">
                  {post.description}
                </p>
                <div className="mt-3 flex gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
