export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  category: string;
  coverImage?: string;
  featured?: boolean;
}

/** All valid categories for filtering and URL generation */
export const BLOG_CATEGORIES = [
  "Guides",
  "Engineering",
  "Product",
  "AI",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

/**
 * Blog post registry.
 * Markdown files live in this directory. Add new posts here and import the .md file
 * in the BlogPostPage component's loader.
 *
 * Posts are sorted by date (newest first) at runtime.
 */
export const blogPosts: BlogPost[] = [
  {
    slug: "getting-started",
    title: "Getting Started with RailsKit",
    description:
      "A quick guide to setting up RailsKit and shipping your first AI-powered Rails app.",
    date: "2026-03-04",
    author: "RailsKit Team",
    tags: ["guide", "quickstart"],
    category: "Guides",
    featured: true,
  },
  {
    slug: "why-rails-for-ai",
    title: "Why Rails is Perfect for AI Applications",
    description:
      "Rails brings rapid full-stack development to the AI ecosystem. Here's why it matters.",
    date: "2026-03-04",
    author: "RailsKit Team",
    tags: ["opinion", "rails", "ai"],
    category: "AI",
  },
];

/** Sorted by date (newest first) */
export const sortedPosts = [...blogPosts].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);

/** Estimate reading time in minutes */
export function readingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 220));
}

/** Group posts by category */
export function postsByCategory(): Record<string, BlogPost[]> {
  const groups: Record<string, BlogPost[]> = {};
  for (const post of sortedPosts) {
    if (!groups[post.category]) groups[post.category] = [];
    groups[post.category].push(post);
  }
  return groups;
}

/** Get unique tags across all posts */
export function allTags(): string[] {
  const tags = new Set<string>();
  for (const post of blogPosts) {
    for (const tag of post.tags) tags.add(tag);
  }
  return [...tags].sort();
}
