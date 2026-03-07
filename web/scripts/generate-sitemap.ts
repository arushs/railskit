/**
 * Sitemap generator for RailsKit.
 *
 * Run: npx tsx scripts/generate-sitemap.ts
 * Output: public/sitemap.xml
 *
 * Automatically includes all blog posts and category pages.
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SITE_URL = process.env.SITE_URL || "https://railskit.dev";

interface SitemapEntry {
  loc: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
  lastmod?: string;
}

// Blog posts registry (mirrored — keep in sync with src/content/blog/index.ts)
const blogSlugs = [
  { slug: "getting-started", date: "2026-03-04", category: "Guides" },
  { slug: "why-rails-for-ai", date: "2026-03-04", category: "AI" },
];

const categories = [...new Set(blogSlugs.map((p) => p.category))];

// Static pages
const staticPages: SitemapEntry[] = [
  { loc: "/", changefreq: "weekly", priority: 1.0 },
  { loc: "/login", changefreq: "monthly", priority: 0.3 },
  { loc: "/signup", changefreq: "monthly", priority: 0.5 },
  { loc: "/blog", changefreq: "daily", priority: 0.8 },
];

// Category pages
const categoryPages: SitemapEntry[] = categories.map((cat) => ({
  loc: `/blog?category=${encodeURIComponent(cat)}`,
  changefreq: "weekly" as const,
  priority: 0.6,
}));

// Blog post pages
const blogPages: SitemapEntry[] = blogSlugs.map((p) => ({
  loc: `/blog/${p.slug}`,
  changefreq: "monthly" as const,
  priority: 0.7,
  lastmod: p.date,
}));

function generateSitemap(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (e) => `  <url>
    <loc>${SITE_URL}${e.loc}</loc>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ""}
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

const all = [...staticPages, ...categoryPages, ...blogPages];
const xml = generateSitemap(all);
const outPath = resolve(__dirname, "../public/sitemap.xml");
writeFileSync(outPath, xml, "utf-8");
console.log(`✅ Sitemap generated: ${outPath} (${all.length} URLs — ${staticPages.length} static, ${categoryPages.length} categories, ${blogPages.length} posts)`);
