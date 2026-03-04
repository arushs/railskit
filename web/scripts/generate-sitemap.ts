/**
 * Sitemap generator for RailsKit.
 *
 * Run: npx tsx scripts/generate-sitemap.ts
 * Output: public/sitemap.xml
 *
 * Add blog posts to the BLOG_POSTS array or wire up to your blog content directory.
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SITE_URL = "https://railskit.dev";

interface SitemapEntry {
  loc: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
  lastmod?: string;
}

// Static pages
const staticPages: SitemapEntry[] = [
  { loc: "/", changefreq: "weekly", priority: 1.0 },
  { loc: "/login", changefreq: "monthly", priority: 0.3 },
  { loc: "/signup", changefreq: "monthly", priority: 0.5 },
  { loc: "/blog", changefreq: "daily", priority: 0.8 },
];

// Blog posts — add dynamically or import from blog content index
const blogPosts: SitemapEntry[] = [
  {
    loc: "/blog/getting-started",
    changefreq: "monthly",
    priority: 0.7,
    lastmod: "2026-03-04",
  },
  {
    loc: "/blog/why-rails-for-ai",
    changefreq: "monthly",
    priority: 0.7,
    lastmod: "2026-03-04",
  },
];

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

const all = [...staticPages, ...blogPosts];
const xml = generateSitemap(all);
const outPath = resolve(__dirname, "../public/sitemap.xml");
writeFileSync(outPath, xml, "utf-8");
console.log(`✅ Sitemap generated: ${outPath} (${all.length} URLs)`);
