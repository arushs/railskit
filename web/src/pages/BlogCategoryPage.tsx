import { useParams, Link, Navigate } from "react-router";
import SEO from "@/components/seo/SEO";
import { breadcrumbJsonLd } from "@/components/seo/structured-data";
import { getPostsByCategory, getAllCategories } from "@/lib/blog";

export default function BlogCategoryPage() {
  const { category } = useParams<{ category: string }>();

  if (!category) return <Navigate to="/blog" replace />;

  const categories = getAllCategories();
  const cat = categories.find((c) => c.slug === category);
  const posts = getPostsByCategory(category);

  if (!cat || posts.length === 0) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <SEO
        title={`${cat.name} — Blog`}
        description={cat.description}
        canonical={`/blog/category/${category}`}
        jsonLd={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: cat.name, url: `/blog/category/${category}` },
        ])}
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
        <h1 className="text-4xl font-bold tracking-tight">{cat.name}</h1>
        <p className="mt-3 text-lg text-zinc-400">{cat.description}</p>

        {/* Other categories */}
        <div className="mt-6 flex flex-wrap gap-2">
          {categories
            .filter((c) => c.slug !== category)
            .map((c) => (
              <Link
                key={c.slug}
                to={`/blog/category/${c.slug}`}
                className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-400 hover:text-white transition"
              >
                {c.name} ({c.count})
              </Link>
            ))}
        </div>

        <div className="mt-12 space-y-10">
          {posts.map((post) => (
            <article key={post.slug} className="group">
              <Link to={`/blog/${post.slug}`} className="block">
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <time>{post.date}</time>
                  <span className="text-zinc-700">·</span>
                  <span>{post.readingTime} min read</span>
                </div>
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
