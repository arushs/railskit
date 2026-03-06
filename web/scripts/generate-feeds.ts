/**
 * Build-time script: generates RSS feed (feed.xml) and sitemap (sitemap.xml)
 * from blog markdown files with front matter.
 *
 * Run: npx tsx scripts/generate-feeds.ts
 * Outputs to: web/public/feed.xml, web/public/sitemap.xml
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { Feed } from "feed";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = "https://railskit.dev";
const BLOG_DIR = path.resolve(__dirname, "../src/content/blog");
const PUBLIC_DIR = path.resolve(__dirname, "../public");

interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  content: string;
}

function loadPosts(): PostMeta[] {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md") && f !== "index.ts");
  const posts: PostMeta[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    const slug = file.replace(/\.md$/, "");

    posts.push({
      slug,
      title: data.title ?? slug,
      description: data.description ?? "",
      date: data.date ?? "",
      author: data.author ?? "RailsKit Team",
      category: data.category ?? "uncategorized",
      tags: Array.isArray(data.tags) ? data.tags : [],
      image: data.image,
      content,
    });
  }

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

function generateRSS(posts: PostMeta[]): string {
  const feed = new Feed({
    title: "RailsKit Blog",
    description:
      "Guides, tutorials, and insights on building AI-powered Rails applications with RailsKit.",
    id: SITE_URL,
    link: SITE_URL,
    language: "en",
    image: `${SITE_URL}/logo.png`,
    favicon: `${SITE_URL}/favicon.ico`,
    copyright: `© ${new Date().getFullYear()} RailsKit`,
    feedLinks: {
      rss2: `${SITE_URL}/feed.xml`,
      atom: `${SITE_URL}/atom.xml`,
    },
    author: {
      name: "RailsKit Team",
      link: SITE_URL,
    },
  });

  for (const post of posts) {
    feed.addItem({
      title: post.title,
      id: `${SITE_URL}/blog/${post.slug}`,
      link: `${SITE_URL}/blog/${post.slug}`,
      description: post.description,
      content: post.content,
      author: [{ name: post.author }],
      date: new Date(post.date),
      category: post.tags.map((t) => ({ name: t })),
      image: post.image ? `${SITE_URL}${post.image}` : undefined,
    });
  }

  // Add category-specific feeds
  const categories = [...new Set(posts.map((p) => p.category))];
  for (const cat of categories) {
    feed.addCategory(cat);
  }

  return feed.rss2();
}

function generateAtom(posts: PostMeta[]): string {
  const feed = new Feed({
    title: "RailsKit Blog",
    description:
      "Guides, tutorials, and insights on building AI-powered Rails applications with RailsKit.",
    id: SITE_URL,
    link: SITE_URL,
    language: "en",
    copyright: `© ${new Date().getFullYear()} RailsKit`,
    feedLinks: {
      atom: `${SITE_URL}/atom.xml`,
    },
    author: {
      name: "RailsKit Team",
      link: SITE_URL,
    },
  });

  for (const post of posts) {
    feed.addItem({
      title: post.title,
      id: `${SITE_URL}/blog/${post.slug}`,
      link: `${SITE_URL}/blog/${post.slug}`,
      description: post.description,
      content: post.content,
      author: [{ name: post.author }],
      date: new Date(post.date),
      category: post.tags.map((t) => ({ name: t })),
    });
  }

  return feed.atom1();
}

function generateSitemap(posts: PostMeta[]): string {
  const categories = [...new Set(posts.map((p) => p.category))];
  const today = new Date().toISOString().split("T")[0];

  const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [
    // Static pages
    { loc: "/", lastmod: today, changefreq: "weekly", priority: "1.0" },
    { loc: "/blog", lastmod: today, changefreq: "daily", priority: "0.9" },

    // Category pages
    ...categories.map((cat) => ({
      loc: `/blog/category/${cat}`,
      lastmod: today,
      changefreq: "weekly" as const,
      priority: "0.7",
    })),

    // Blog posts
    ...posts.map((post) => ({
      loc: `/blog/${post.slug}`,
      lastmod: post.date,
      changefreq: "monthly" as const,
      priority: "0.8",
    })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;
}

// --- Main ---
const posts = loadPosts();

fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// RSS 2.0
const rss = generateRSS(posts);
fs.writeFileSync(path.join(PUBLIC_DIR, "feed.xml"), rss, "utf-8");
console.log(`✅ feed.xml — ${posts.length} posts`);

// Atom
const atom = generateAtom(posts);
fs.writeFileSync(path.join(PUBLIC_DIR, "atom.xml"), atom, "utf-8");
console.log(`✅ atom.xml — ${posts.length} posts`);

// Sitemap
const sitemap = generateSitemap(posts);
fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), sitemap, "utf-8");
const urlCount = 2 + [...new Set(posts.map((p) => p.category))].length + posts.length;
console.log(`✅ sitemap.xml — ${urlCount} URLs`);

// robots.txt
const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
fs.writeFileSync(path.join(PUBLIC_DIR, "robots.txt"), robots, "utf-8");
console.log("✅ robots.txt");
