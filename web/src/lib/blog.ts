/**
 * Blog engine — parses front matter from markdown files, provides
 * category filtering, reading time estimation, and post lookups.
 */
import matter from "gray-matter";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  readingTime: number; // minutes
  content: string;
}

export interface BlogCategory {
  slug: string;
  name: string;
  description: string;
  count: number;
}

// Vite glob import: raw markdown files
const markdownModules = import.meta.glob("/src/content/blog/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/** Estimate reading time (~200 wpm) */
function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Extract slug from file path */
function slugFromPath(path: string): string {
  const match = path.match(/\/([^/]+)\.md$/);
  return match?.[1] ?? "";
}

/** Parse all blog posts from markdown files with front matter */
function parseAllPosts(): BlogPost[] {
  const posts: BlogPost[] = [];

  for (const [path, raw] of Object.entries(markdownModules)) {
    const slug = slugFromPath(path);
    if (!slug || slug === "index") continue;

    const { data, content } = matter(raw);

    posts.push({
      slug,
      title: data.title ?? slug,
      description: data.description ?? "",
      date: data.date ?? "",
      author: data.author ?? "RailsKit Team",
      category: data.category ?? "uncategorized",
      tags: Array.isArray(data.tags) ? data.tags : [],
      image: data.image,
      readingTime: estimateReadingTime(content),
      content,
    });
  }

  // Sort by date descending
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

// Cache parsed posts (they don't change at runtime in a SPA)
let _postsCache: BlogPost[] | null = null;

/** Get all published blog posts, sorted by date desc */
export function getAllPosts(): BlogPost[] {
  if (!_postsCache) {
    _postsCache = parseAllPosts();
  }
  return _postsCache;
}

/** Get a single post by slug */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

/** Get posts filtered by category slug */
export function getPostsByCategory(categorySlug: string): BlogPost[] {
  return getAllPosts().filter((p) => p.category === categorySlug);
}

/** Get posts filtered by tag */
export function getPostsByTag(tag: string): BlogPost[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}

/** Category definitions — extend as needed */
const CATEGORY_META: Record<string, { name: string; description: string }> = {
  guides: {
    name: "Guides",
    description: "Step-by-step tutorials and how-to articles for building with RailsKit.",
  },
  opinions: {
    name: "Opinions",
    description: "Perspectives on Rails, AI, and building products.",
  },
  releases: {
    name: "Releases",
    description: "Changelogs, new features, and version announcements.",
  },
  uncategorized: {
    name: "Uncategorized",
    description: "Other posts.",
  },
};

/** Get all categories with post counts */
export function getAllCategories(): BlogCategory[] {
  const posts = getAllPosts();
  const countMap = new Map<string, number>();

  for (const post of posts) {
    countMap.set(post.category, (countMap.get(post.category) ?? 0) + 1);
  }

  return Array.from(countMap.entries())
    .map(([slug, count]) => ({
      slug,
      name: CATEGORY_META[slug]?.name ?? slug.charAt(0).toUpperCase() + slug.slice(1),
      description: CATEGORY_META[slug]?.description ?? "",
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Get all unique tags with post counts */
export function getAllTags(): { tag: string; count: number }[] {
  const posts = getAllPosts();
  const tagMap = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.tags) {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/** Get related posts (same category or shared tags, excluding current) */
export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const current = getPostBySlug(slug);
  if (!current) return [];

  const posts = getAllPosts().filter((p) => p.slug !== slug);

  // Score by shared tags + same category
  const scored = posts.map((p) => {
    let score = 0;
    if (p.category === current.category) score += 2;
    for (const tag of p.tags) {
      if (current.tags.includes(tag)) score += 1;
    }
    return { post: p, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.post);
}

/** Site URL for feed/sitemap generation */
export const SITE_URL = "https://railskit.dev";
