/**
 * Generate RSS feed from blog posts.
 * Run: npx tsx scripts/generate-rss.ts
 * Output: public/rss.xml
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mirror the blog post interface (can't import .ts with path aliases easily)
interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  category: string;
}

// Import blog posts - hardcoded to avoid alias resolution issues in scripts
const blogPosts: BlogPost[] = [
  {
    slug: "getting-started",
    title: "Getting Started with RailsKit",
    description: "A quick guide to setting up RailsKit and shipping your first AI-powered Rails app.",
    date: "2026-03-04",
    author: "RailsKit Team",
    tags: ["guide", "quickstart"],
    category: "Guides",
  },
  {
    slug: "why-rails-for-ai",
    title: "Why Rails is Perfect for AI Applications",
    description: "Rails brings rapid full-stack development to the AI ecosystem. Here's why it matters.",
    date: "2026-03-04",
    author: "RailsKit Team",
    tags: ["opinion", "rails", "ai"],
    category: "AI",
  },
];

const SITE_URL = process.env.SITE_URL || "https://railskit.dev";
const SITE_TITLE = "RailsKit Blog";
const SITE_DESCRIPTION = "Guides, tutorials, and insights on building AI-powered Rails applications.";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateRss(): string {
  const sorted = [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const items = sorted
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${post.slug}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <author>${escapeXml(post.author)}</author>
      <category>${escapeXml(post.category)}</category>${post.tags
        .map((tag) => `\n      <category>${escapeXml(tag)}</category>`)
        .join("")}
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}/blog</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}

const rss = generateRss();
const outPath = resolve(__dirname, "../public/rss.xml");
writeFileSync(outPath, rss, "utf-8");
console.log(`✅ RSS feed written to ${outPath} (${blogPosts.length} posts)`);
